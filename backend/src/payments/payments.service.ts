import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreatePaymentDto, UpdatePaymentStatusDto } from './dto/payment.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/entities/audit-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly bookingsService: BookingsService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Fix 3a: currentUser is now required.  We verify booking.userId matches
   * the authenticated user so a user cannot initiate payment for someone
   * else's booking.
   *
   * Fix 4: dto.amount must equal booking.totalPrice to prevent under-payment.
   */
  async create(dto: CreatePaymentDto, currentUser: User): Promise<Payment> {
    // Fix 11: booking is always fully loaded (eager on Payment.booking handles
    // findOne paths; here we load it explicitly via Booking repository).
    const booking = await this.bookingRepository.findOne({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking #${dto.bookingId} not found`);
    }

    // Fix 3a: only the booking owner can initiate their own payment
    if (booking.userId !== currentUser.id && !currentUser.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'You can only initiate payment for your own bookings',
      );
    }

    if (booking.status !== BookingStatus.AWAITING_PAYMENT) {
      throw new BadRequestException(
        `Payment can only be initiated for bookings in AWAITING_PAYMENT status. ` +
        `Current status: ${booking.status}`,
      );
    }

    /**
     * Fix 4: validate that the submitted amount matches the calculated total.
     * Prevents a client from sending an artificially low amount to underpay.
     * We compare after rounding both values to 2 decimal places.
     */
    const expectedAmount = parseFloat(Number(booking.totalPrice).toFixed(2));
    const submittedAmount = parseFloat(Number(dto.amount).toFixed(2));

    if (submittedAmount !== expectedAmount) {
      throw new BadRequestException(
        `Payment amount ${submittedAmount} does not match booking total ${expectedAmount}`,
      );
    }

    // Prevent duplicate payment records (idempotency)
    const existing = await this.paymentRepository.findOne({
      where: { bookingId: dto.bookingId },
    });
    if (existing && existing.status !== PaymentStatus.FAILED) {
      throw new ConflictException('An active payment already exists for this booking');
    }

    const payment = this.paymentRepository.create({
      bookingId: dto.bookingId,
      amount: dto.amount,
      provider: dto.provider,
      transactionId: dto.transactionId,
      status: PaymentStatus.PENDING,
    });

    const saved = await this.paymentRepository.save(payment);

    void this.auditLogService.log({
      userId: currentUser.id,
      action: AuditAction.CREATE,
      entity: 'Payment',
      entityId: saved.id,
      metadata: { bookingId: dto.bookingId, amount: dto.amount, provider: dto.provider },
    });

    return saved;
  }

  /**
   * Fix 3b: ownership check before processing.
   * Fix 15: simulateFailure is only permitted in non-production environments.
   */
  async processPayment(
    id: string,
    currentUser: User,
    simulateFailure = false,
  ): Promise<Payment> {
    const payment = await this.findOne(id);

    // Fix 3b: only the booking owner or ADMIN can trigger payment processing
    const bookingUserId = payment.booking?.userId;
    const isAdmin = currentUser.roles.includes(UserRole.ADMIN);

    if (bookingUserId && bookingUserId !== currentUser.id && !isAdmin) {
      throw new ForbiddenException(
        'You can only process payment for your own bookings',
      );
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment has already been processed');
    }

    /**
     * Fix 15: simulateFailure is a developer tool — it must never be reachable
     * in production, even if the flag is somehow passed in a request.
     */
    const isProduction = process.env.NODE_ENV === 'production';
    if (simulateFailure && isProduction) {
      throw new BadRequestException('simulateFailure is not available in production');
    }

    if (simulateFailure) {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = {
        ...payment.metadata,
        failedAt: new Date().toISOString(),
        reason: 'Simulated gateway failure (dev/test only)',
      };
      await this.paymentRepository.save(payment);

      await this.bookingsService.revertAfterPaymentFailure(payment.bookingId);

      void this.auditLogService.log({
        userId: currentUser.id,
        action: AuditAction.PAYMENT_FAILURE,
        entity: 'Payment',
        entityId: payment.id,
        metadata: { bookingId: payment.bookingId },
      });

      // Fix 11: booking is eager-loaded so userId is always present
      void this.notificationsService.notify({
        userId: payment.booking.userId,
        type: NotificationType.PAYMENT_FAILED,
        message: `Your payment could not be processed. Please try again.`,
        relatedEntity: 'Payment',
        relatedEntityId: payment.id,
      });

      return payment;
    }

    // ── Gateway success path ──────────────────────────────────────────────
    // In production: replace this block with your actual gateway call,
    // e.g. const result = await this.stripeService.charge(payment);
    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    payment.metadata = {
      ...payment.metadata,
      processedAt: new Date().toISOString(),
      note: 'Payment gateway integration placeholder',
    };
    await this.paymentRepository.save(payment);

    await this.bookingsService.approveAfterPayment(payment.bookingId);

    void this.auditLogService.log({
      userId: currentUser.id,
      action: AuditAction.PAYMENT_SUCCESS,
      entity: 'Payment',
      entityId: payment.id,
      metadata: { bookingId: payment.bookingId, amount: payment.amount },
    });

    void this.notificationsService.notify({
      userId: payment.booking.userId,
      type: NotificationType.PAYMENT_SUCCESS,
      message: `Your payment of $${payment.amount} was successful. Booking confirmed!`,
      relatedEntity: 'Payment',
      relatedEntityId: payment.id,
    });

    return payment;
  }

  /**
   * Fix 3c: restrict read access to booking owner or ADMIN.
   */
  async findOne(id: string, currentUser?: User): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['booking'],
    });
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);

    if (currentUser) {
      this.assertReadAccess(payment, currentUser);
    }

    return payment;
  }

  /**
   * Fix 3d: restrict read access to booking owner or ADMIN.
   */
  async findByBooking(bookingId: string, currentUser: User): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { bookingId },
      relations: ['booking'],
    });
    if (!payment) {
      throw new NotFoundException(`No payment found for booking #${bookingId}`);
    }

    this.assertReadAccess(payment, currentUser);
    return payment;
  }

  async updateStatus(id: string, dto: UpdatePaymentStatusDto): Promise<Payment> {
    // No currentUser check here — this endpoint is ADMIN-only (enforced at controller)
    const payment = await this.findOne(id);
    const previousStatus = payment.status;
    payment.status = dto.status;
    if (dto.transactionId) payment.transactionId = dto.transactionId;
    if (dto.status === PaymentStatus.COMPLETED) payment.paidAt = new Date();
    const updated = await this.paymentRepository.save(payment);

    void this.auditLogService.log({
      userId: null,
      action: AuditAction.UPDATE,
      entity: 'Payment',
      entityId: id,
      metadata: { from: previousStatus, to: dto.status },
    });

    return updated;
  }

  async refund(id: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.metadata = {
      ...payment.metadata,
      refundedAt: new Date().toISOString(),
    };
    const updated = await this.paymentRepository.save(payment);

    void this.auditLogService.log({
      userId: null,
      action: AuditAction.PAYMENT_REFUND,
      entity: 'Payment',
      entityId: id,
      metadata: { bookingId: payment.bookingId, amount: payment.amount },
    });

    void this.notificationsService.notify({
      userId: payment.booking.userId,
      type: NotificationType.PAYMENT_REFUNDED,
      message: `A refund of $${payment.amount} has been initiated.`,
      relatedEntity: 'Payment',
      relatedEntityId: id,
    });

    return updated;
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  /**
   * Fix 3c/3d: shared read-access assertion.
   * The booking owner and ADMINs can read payment details; no one else can.
   */
  private assertReadAccess(payment: Payment, user: User): void {
    const isAdmin = user.roles.includes(UserRole.ADMIN);
    const isOwner = payment.booking?.userId === user.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You do not have permission to view this payment',
      );
    }
  }
}
