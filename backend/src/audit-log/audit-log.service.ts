import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

export interface LogPayload {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /**
   * Persist an audit entry. Swallows errors so a logging failure never
   * crashes a business-critical request path.
   */
  async log(payload: LogPayload): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          userId: payload.userId ?? null,
          action: payload.action,
          entity: payload.entity,
          entityId: payload.entityId,
          metadata: payload.metadata ?? null,
        }),
      );
    } catch (err) {
      // Logging must never bring down the app
      this.logger.error('Failed to write audit log', err);
    }
  }

  /** Fetch audit history for a specific entity row */
  async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return this.repo.find({
      where: { entity, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Fetch all actions performed by a specific user */
  async findByUser(userId: string): Promise<AuditLog[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
