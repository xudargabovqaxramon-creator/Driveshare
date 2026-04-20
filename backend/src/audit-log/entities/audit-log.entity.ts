import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SOFT_DELETE = 'SOFT_DELETE',
  RESTORE = 'RESTORE',
  LOGIN = 'LOGIN',
  STATUS_CHANGE = 'STATUS_CHANGE',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILURE = 'PAYMENT_FAILURE',
  PAYMENT_REFUND = 'PAYMENT_REFUND',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['entity', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The user who triggered the action. Nullable for system-generated events.
   */
  @Column({ nullable: true })
  userId: string | null;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  /** e.g. 'Car', 'Booking', 'Payment', 'User' */
  @Column({ length: 50 })
  entity: string;

  /** The primary-key of the affected row */
  @Column({ length: 255 })
  entityId: string;

  /**
   * Free-form JSON snapshot: before/after values, IP address, extra context.
   * Never store PII (passwords, tokens) here.
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
