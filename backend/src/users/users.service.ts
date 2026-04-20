import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto, UpdatePasswordDto } from './dto/user.dto';
import { PaginationDto, paginate, PaginatedResult } from '../common/dto/pagination.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/entities/audit-log.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = pagination;
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    requestingUser: User,
  ): Promise<User> {
    const user = await this.findOne(id);
    const isAdmin = requestingUser.roles.includes(UserRole.ADMIN);
    const isSelf = requestingUser.id === id;

    // Non-admins can only update their own profile
    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }

    /**
     * Security: `roles` and `isActive` are privileged fields.
     * A non-admin submitting either field is rejected outright — we do NOT
     * strip the fields and silently continue, because silent stripping masks
     * an attempted privilege escalation that should be visible in logs.
     */
    if (dto.roles !== undefined && !isAdmin) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    if (dto.isActive !== undefined && !isAdmin) {
      throw new ForbiddenException('Only admins can change account activation status');
    }

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.findByEmail(dto.email);
      if (emailExists) throw new ConflictException('Email already in use');
    }

    Object.assign(user, dto);
    const saved = await this.userRepository.save(user);

    void this.auditLogService.log({
      userId: requestingUser.id,
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: id,
      // Never log raw DTO — it could contain PII; log field names only
      metadata: { changedFields: Object.keys(dto) },
    });

    return saved;
  }

  async updatePassword(
    id: string,
    dto: UpdatePasswordDto,
    requestingUser: User,
  ): Promise<{ message: string }> {
    if (requestingUser.id !== id) {
      throw new ForbiddenException('You can only change your own password');
    }

    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) throw new ForbiddenException('Current password is incorrect');

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  /**
   * Soft-delete: sets deletedAt and immediately deactivates isActive so any
   * live JWT is rejected on the next request (JwtStrategy checks isActive).
   */
  async remove(id: string, requestingUser: User): Promise<void> {
    const user = await this.findOne(id);
    const isAdmin = requestingUser.roles.includes(UserRole.ADMIN);
    const isSelf = requestingUser.id === id;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('Insufficient permissions');
    }

    user.isActive = false;
    await this.userRepository.save(user);
    await this.userRepository.softDelete(id);

    void this.auditLogService.log({
      userId: requestingUser.id,
      action: AuditAction.SOFT_DELETE,
      entity: 'User',
      entityId: id,
    });
  }

  /**
   * Restore is intentionally not exposed on any controller — it is available
   * for internal/admin tooling only (e.g. a future admin panel or CLI command).
   */
  async restore(id: string): Promise<void> {
    await this.userRepository.restore(id);
    await this.userRepository.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return this.userRepository.save(user);
  }
}
