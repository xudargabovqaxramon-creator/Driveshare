import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  Booking,
  BookingStatus,
  TERMINAL_BOOKING_STATUSES,
} from './entities/booking.entity';
import { Car, CarStatus } from '../cars/entities/car.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  FilterBookingsDto,
} from './dto/booking.dto';
import { paginate, PaginatedResult } from '../common/dto/pagination.dto';
import { CarsService } from '../cars/cars.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/entities/audit-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
    private readonly carsService: CarsService,
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── CREATE (transactional, pessimistic-lock concurrency-safe) ───────────

  async create(dto: CreateBookingDto, user: User): Promise<Booking> {
    const { carId, startDate, endDate, notes } = dto;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('startDate or endDate is not a valid date');
    }
    if (start < today) {
      throw new BadRequestException('startDate cannot be in the past');
    }
    if (end <= start) {
      throw new BadRequestException('endDate must be strictly after startDate');
    }
    const rentalDays = this.calculateDays(start, end);
    if (rentalDays < 1) {
      throw new BadRequestException('Minimum rental duration is 1 day');
    }

    const booking = await this.dataSource.transaction(async (manager) => {
      // Pessimistic write-lock: concurrent requests for the same car serialize here.
      const car = await manager
        .createQueryBuilder(Car, 'car')
        .setLock('pessimistic_write')
        .where('car.id = :carId', { carId })
        .andWhere('car.deletedAt IS NULL')
        .getOne();

      if (!car) throw new NotFoundException(`Car #${carId} not found`);
      if (car.status === CarStatus.MAINTENANCE) {
        throw new BadRequestException('This car is currently under maintenance');
      }

      // Overlap check runs inside the lock — safe under concurrency.
      const overlap = await manager
        .createQueryBuilder(Booking, 'booking')
        .where('booking.carId = :carId', { carId })
        .andWhere('booking.status NOT IN (:...excluded)', {
          excluded: [BookingStatus.CANCELLED, BookingStatus.REJECTED],
        })
        .andWhere('booking.startDate < :end', { end })
        .andWhere('booking.endDate > :start', { start })
        .andWhere('booking.deletedAt IS NULL')
        .getOne();

      if (overlap) {
        const s = overlap.startDate.toISOString().split('T')[0];
        const e = overlap.endDate.toISOString().split('T')[0];
        throw new ConflictException(`Car is already booked from ${s} to ${e}`);
      }

      const totalPrice = parseFloat(
        (rentalDays * Number(car.pricePerDay)).toFixed(2),
      );

      const newBooking = manager.create(Booking, {
        userId: user.id,
        carId,
        startDate: start,
        endDate: end,
        totalPrice,
        notes,
        status: BookingStatus.PENDING,
      });

      return manager.save(Booking, newBooking);
    });

    void this.auditLogService.log({
      userId: user.id,
      action: AuditAction.CREATE,
      entity: 'Booking',
      entityId: booking.id,
      metadata: { carId, startDate, endDate, totalPrice: booking.totalPrice },
    });

    void this.notificationsService.notify({
      userId: user.id,
      type: NotificationType.BOOKING_CREATED,
      message: `Your booking request has been received and is pending review.`,
      relatedEntity: 'Booking',
      relatedEntityId: booking.id,
    });

    return booking;
  }

  // ─── UPDATE STATUS (Fix 6: fully transactional) ──────────────────────────

  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
    requestingUser: User,
  ): Promise<Booking> {
    const booking = await this.findOne(id);
    const previousStatus = booking.status;

    // Fix 5: guard terminal states before any other check
    this.assertNotTerminal(booking.status);
    this.assertCanUpdateStatus(booking, dto.status, requestingUser);
    this.validateStatusTransition(booking.status, dto.status);

    /**
     * Fix 6: wrap booking save + car status update in a single transaction
     * so the two writes are atomic.  A crash between them can no longer leave
     * the booking approved but the car still available (or vice-versa).
     */
    const updated = await this.dataSource.transaction(async (manager) => {
      booking.status = dto.status;

      if (dto.rejectionReason && dto.status === BookingStatus.REJECTED) {
        booking.rejectionReason = dto.rejectionReason;
      }

      // Determine car status side-effect
      if (dto.status === BookingStatus.APPROVED) {
        await manager.update(Car, { id: booking.carId }, { status: CarStatus.BOOKED });
      }

      if (
        [
          BookingStatus.CANCELLED,
          BookingStatus.REJECTED,
          BookingStatus.COMPLETED,
        ].includes(dto.status)
      ) {
        await manager.update(Car, { id: booking.carId }, { status: CarStatus.AVAILABLE });
      }

      return manager.save(Booking, booking);
    });

    // Notifications (fire-and-forget, outside transaction)
    void this.sendStatusNotification(updated, dto.status, dto.rejectionReason);

    void this.auditLogService.log({
      userId: requestingUser.id,
      action: AuditAction.STATUS_CHANGE,
      entity: 'Booking',
      entityId: booking.id,
      metadata: {
        from: previousStatus,
        to: dto.status,
        rejectionReason: dto.rejectionReason,
      },
    });

    return updated;
  }

  // ─── APPROVE AFTER PAYMENT ────────────────────────────────────────────────
  // Internal use only — called by PaymentsService.  NOT exposed on any controller.
  // Fix 5: method is intentionally package-private by convention; it validates
  // the expected prior state so it cannot be misused even if called internally.

  async approveAfterPayment(bookingId: string): Promise<Booking> {
    const booking = await this.findOne(bookingId);

    if (booking.status !== BookingStatus.AWAITING_PAYMENT) {
      throw new BadRequestException(
        `Cannot approve booking: expected AWAITING_PAYMENT, got ${booking.status}`,
      );
    }

    // Fix 6: atomic — both the booking status and car status change together
    const updated = await this.dataSource.transaction(async (manager) => {
      booking.status = BookingStatus.APPROVED;
      await manager.update(Car, { id: booking.carId }, { status: CarStatus.BOOKED });
      return manager.save(Booking, booking);
    });

    void this.auditLogService.log({
      userId: null,
      action: AuditAction.STATUS_CHANGE,
      entity: 'Booking',
      entityId: booking.id,
      metadata: {
        from: BookingStatus.AWAITING_PAYMENT,
        to: BookingStatus.APPROVED,
        trigger: 'payment_success',
      },
    });

    void this.notificationsService.notify({
      userId: booking.userId,
      type: NotificationType.BOOKING_APPROVED,
      message: `Payment confirmed! Your booking is approved and the car is reserved.`,
      relatedEntity: 'Booking',
      relatedEntityId: booking.id,
    });

    return updated;
  }

  // ─── REVERT AFTER PAYMENT FAILURE ─────────────────────────────────────────

  async revertAfterPaymentFailure(bookingId: string): Promise<Booking> {
    const booking = await this.findOne(bookingId);

    if (booking.status !== BookingStatus.AWAITING_PAYMENT) {
      throw new BadRequestException(
        `Cannot revert booking: expected AWAITING_PAYMENT, got ${booking.status}`,
      );
    }

    // Return to PENDING so the user can retry; car stays available throughout.
    booking.status = BookingStatus.PENDING;
    const updated = await this.bookingRepository.save(booking);

    void this.auditLogService.log({
      userId: null,
      action: AuditAction.STATUS_CHANGE,
      entity: 'Booking',
      entityId: booking.id,
      metadata: {
        from: BookingStatus.AWAITING_PAYMENT,
        to: BookingStatus.PENDING,
        trigger: 'payment_failed',
      },
    });

    void this.notificationsService.notify({
      userId: booking.userId,
      type: NotificationType.PAYMENT_FAILED,
      message: `Your payment failed. Your booking is back to pending — please try again.`,
      relatedEntity: 'Booking',
      relatedEntityId: booking.id,
    });

    return updated;
  }

  // ─── CANCEL (Fix 6: transactional) ────────────────────────────────────────

  async cancel(id: string, requestingUser: User): Promise<Booking> {
    const booking = await this.findOne(id);

    // Fix 2: ownership enforced — only the booking creator (or ADMIN) can cancel
    const isAdmin = requestingUser.roles.includes(UserRole.ADMIN);
    if (booking.userId !== requestingUser.id && !isAdmin) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    // Fix 5: check terminal state explicitly
    this.assertNotTerminal(booking.status);

    const cancellable = [
      BookingStatus.PENDING,
      BookingStatus.AWAITING_PAYMENT,
      BookingStatus.APPROVED,
    ];
    if (!cancellable.includes(booking.status)) {
      throw new BadRequestException(
        `Cannot cancel a booking with status: ${booking.status}`,
      );
    }

    const previousStatus = booking.status;

    // Fix 6: atomic cancel — booking status + car release in one transaction
    const updated = await this.dataSource.transaction(async (manager) => {
      booking.status = BookingStatus.CANCELLED;

      // Only release the car if it had already been marked as booked
      if (previousStatus === BookingStatus.APPROVED) {
        await manager.update(Car, { id: booking.carId }, { status: CarStatus.AVAILABLE });
      }

      return manager.save(Booking, booking);
    });

    void this.auditLogService.log({
      userId: requestingUser.id,
      action: AuditAction.STATUS_CHANGE,
      entity: 'Booking',
      entityId: id,
      metadata: { from: previousStatus, to: BookingStatus.CANCELLED },
    });

    void this.notificationsService.notify({
      userId: booking.userId,
      type: NotificationType.BOOKING_CANCELLED,
      message: `Your booking has been cancelled.`,
      relatedEntity: 'Booking',
      relatedEntityId: id,
    });

    return updated;
  }

  // ─── SOFT DELETE ──────────────────────────────────────────────────────────

  async softRemove(id: string, requestingUser: User): Promise<void> {
    const booking = await this.findOne(id);
    const isAdmin = requestingUser.roles.includes(UserRole.ADMIN);

    if (booking.userId !== requestingUser.id && !isAdmin) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.bookingRepository.softDelete(id);

    void this.auditLogService.log({
      userId: requestingUser.id,
      action: AuditAction.SOFT_DELETE,
      entity: 'Booking',
      entityId: id,
    });
  }

  // ─── QUERIES ──────────────────────────────────────────────────────────────

  async findAll(filters: FilterBookingsDto): Promise<PaginatedResult<Booking>> {
    const { page = 1, limit = 10, status } = filters;
    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.car', 'car')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.payment', 'payment');
    if (status) qb.where('booking.status = :status', { status });
    qb.orderBy('booking.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findMyBookings(userId: string, filters: FilterBookingsDto): Promise<PaginatedResult<Booking>> {
    const { page = 1, limit = 10, status } = filters;
    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.car', 'car')
      .leftJoinAndSelect('booking.payment', 'payment')
      .where('booking.userId = :userId', { userId });
    if (status) qb.andWhere('booking.status = :status', { status });
    qb.orderBy('booking.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findBookingsForMyCars(lessorId: string, filters: FilterBookingsDto): Promise<PaginatedResult<Booking>> {
    const { page = 1, limit = 10, status } = filters;
    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.car', 'car')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.payment', 'payment')
      .where('car.ownerId = :lessorId', { lessorId });
    if (status) qb.andWhere('booking.status = :status', { status });
    qb.orderBy('booking.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['car', 'user', 'payment'],
    });
    if (!booking) throw new NotFoundException(`Booking #${id} not found`);
    return booking;
  }

  /**
   * Fix 2: Ownership-enforced findOne.
   *   - ADMIN  → any booking
   *   - LESSOR → bookings where car.ownerId === user.id
   *   - USER   → only their own bookings
   */
  async findOneWithOwnershipCheck(id: string, requestingUser: User): Promise<Booking> {
    const booking = await this.findOne(id);
    const isAdmin = requestingUser.roles.includes(UserRole.ADMIN);
    const isBookingOwner = booking.userId === requestingUser.id;
    const isCarOwner = booking.car?.ownerId === requestingUser.id;

    if (!isAdmin && !isBookingOwner && !isCarOwner) {
      throw new ForbiddenException('You do not have access to this booking');
    }
    return booking;
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  private calculateDays(start: Date, end: Date): number {
    const ms = end.getTime() - start.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  /**
   * Fix 5: Explicit terminal-state guard — prevents any transition out of
   * CANCELLED, REJECTED, or COMPLETED regardless of the rest of the logic.
   */
  private assertNotTerminal(status: BookingStatus): void {
    if (TERMINAL_BOOKING_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Booking status "${status}" is terminal and cannot be changed`,
      );
    }
  }

  private assertCanUpdateStatus(
    booking: Booking,
    newStatus: BookingStatus,
    user: User,
  ): void {
    const isAdmin = user.roles.includes(UserRole.ADMIN);
    const isCarOwner = booking.car?.ownerId === user.id;
    const isBookingOwner = booking.userId === user.id;

    const lessorOnlyStatuses = [
      BookingStatus.AWAITING_PAYMENT,
      BookingStatus.APPROVED,
      BookingStatus.REJECTED,
      BookingStatus.COMPLETED,
    ];

    if (lessorOnlyStatuses.includes(newStatus) && !isCarOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only the car owner or an admin can perform this status change',
      );
    }

    if (newStatus === BookingStatus.CANCELLED && !isBookingOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only the booking owner or an admin can cancel',
      );
    }
  }

  private validateStatusTransition(
    current: BookingStatus,
    next: BookingStatus,
  ): void {
    const allowed: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [
        BookingStatus.AWAITING_PAYMENT,
        BookingStatus.REJECTED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.AWAITING_PAYMENT]: [
        BookingStatus.APPROVED,
        BookingStatus.CANCELLED,
        BookingStatus.REJECTED,
      ],
      [BookingStatus.APPROVED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      // Terminal — empty arrays; assertNotTerminal catches these first
      [BookingStatus.REJECTED]: [],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.COMPLETED]: [],
    };

    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot transition booking from "${current}" to "${next}"`,
      );
    }
  }

  /** Centralised notification dispatch for status changes */
  private sendStatusNotification(
    booking: Booking,
    status: BookingStatus,
    rejectionReason?: string,
  ): Promise<void> {
    const notifMap: Partial<Record<BookingStatus, { type: NotificationType; message: string }>> = {
      [BookingStatus.AWAITING_PAYMENT]: {
        type: NotificationType.BOOKING_AWAITING_PAYMENT,
        message: 'Your booking has been reviewed. Please complete payment to confirm.',
      },
      [BookingStatus.APPROVED]: {
        type: NotificationType.BOOKING_APPROVED,
        message: 'Your booking has been approved! The car is reserved for you.',
      },
      [BookingStatus.REJECTED]: {
        type: NotificationType.BOOKING_REJECTED,
        message: rejectionReason
          ? `Your booking was rejected: ${rejectionReason}`
          : 'Your booking was rejected by the car owner.',
      },
      [BookingStatus.COMPLETED]: {
        type: NotificationType.BOOKING_COMPLETED,
        message: 'Your rental is complete. Thank you for using our platform!',
      },
    };

    const notif = notifMap[status];
    if (!notif) return Promise.resolve();

    return this.notificationsService.notify({
      userId: booking.userId,
      type: notif.type,
      message: notif.message,
      relatedEntity: 'Booking',
      relatedEntityId: booking.id,
    });
  }
}
