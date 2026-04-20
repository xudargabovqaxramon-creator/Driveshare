import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car, CarStatus } from './entities/car.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCarDto, UpdateCarDto, FilterCarsDto } from './dto/car.dto';
import { paginate, PaginatedResult } from '../common/dto/pagination.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/entities/audit-log.entity';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createCarDto: CreateCarDto, owner: User): Promise<Car> {
    const car = this.carRepository.create({
      ...createCarDto,
      ownerId: owner.id,
      status: CarStatus.AVAILABLE,
    });
    const saved = await this.carRepository.save(car);

    void this.auditLogService.log({
      userId: owner.id,
      action: AuditAction.CREATE,
      entity: 'Car',
      entityId: saved.id,
      metadata: { name: saved.name, brand: saved.brand, pricePerDay: saved.pricePerDay },
    });

    return saved;
  }

  async findAll(filters: FilterCarsDto): Promise<PaginatedResult<Car>> {
    const {
      page = 1,
      limit = 10,
      brand,
      status,
      minPrice,
      maxPrice,
      location,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const qb = this.carRepository
      .createQueryBuilder('car')
      .leftJoinAndSelect('car.owner', 'owner')
      .select(['car', 'owner.id', 'owner.name', 'owner.email']);

    if (brand) {
      qb.andWhere('car.brand ILIKE :brand', { brand: `%${brand}%` });
    }
    if (status) {
      qb.andWhere('car.status = :status', { status });
    }
    if (minPrice !== undefined) {
      qb.andWhere('car.pricePerDay >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('car.pricePerDay <= :maxPrice', { maxPrice });
    }
    if (location) {
      qb.andWhere('car.location ILIKE :location', { location: `%${location}%` });
    }

    const allowed = ['pricePerDay', 'createdAt', 'brand', 'name', 'year'];
    const safeSortBy = allowed.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`car.${safeSortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Car> {
    const car = await this.carRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!car) throw new NotFoundException(`Car #${id} not found`);
    return car;
  }

  async findByOwner(ownerId: string, page = 1, limit = 10): Promise<PaginatedResult<Car>> {
    const [data, total] = await this.carRepository.findAndCount({
      where: { ownerId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return paginate(data, total, page, limit);
  }

  async update(id: string, updateCarDto: UpdateCarDto, requestingUser: User): Promise<Car> {
    const car = await this.findOne(id);
    this.assertOwnerOrAdmin(car, requestingUser, 'update');
    Object.assign(car, updateCarDto);
    const saved = await this.carRepository.save(car);

    void this.auditLogService.log({
      userId: requestingUser.id,
      action: AuditAction.UPDATE,
      entity: 'Car',
      entityId: id,
      metadata: { changes: updateCarDto },
    });

    return saved;
  }

  async addImages(id: string, imagePaths: string[], requestingUser: User): Promise<Car> {
    const car = await this.findOne(id);
    this.assertOwnerOrAdmin(car, requestingUser, 'add images to');
    car.images = [...(car.images || []), ...imagePaths];
    return this.carRepository.save(car);
  }

  /**
   * Soft-delete the car. Sets deletedAt timestamp; TypeORM automatically
   * excludes it from all subsequent queries unless explicitly asked.
   */
  async remove(id: string, requestingUser: User): Promise<void> {
    const car = await this.findOne(id);
    this.assertOwnerOrAdmin(car, requestingUser, 'delete');

    await this.carRepository.softDelete(id);

    void this.auditLogService.log({
      userId: requestingUser.id,
      action: AuditAction.SOFT_DELETE,
      entity: 'Car',
      entityId: id,
      metadata: { name: car.name, brand: car.brand },
    });
  }

  /** Restore a previously soft-deleted car (ADMIN only) */
  async restore(id: string, requestingUser: User): Promise<void> {
    if (!requestingUser.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Only admins can restore deleted cars');
    }
    await this.carRepository.restore(id);

    void this.auditLogService.log({
      userId: requestingUser.id,
      action: AuditAction.RESTORE,
      entity: 'Car',
      entityId: id,
    });
  }

  async setStatus(id: string, status: CarStatus): Promise<Car> {
    const car = await this.findOne(id);
    car.status = status;
    return this.carRepository.save(car);
  }

  /**
   * Strict ownership guard.
   *
   * LESSOR: may only mutate their own cars.
   * ADMIN:  may mutate any car.
   * Others: always rejected.
   */
  private assertOwnerOrAdmin(car: Car, user: User, action = 'modify'): void {
    const isOwner = car.ownerId === user.id;
    const isAdmin = user.roles.includes(UserRole.ADMIN);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        `You do not have permission to ${action} this car`,
      );
    }
  }
}
