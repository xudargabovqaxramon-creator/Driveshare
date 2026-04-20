import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  MANUAL = 'manual',
}

@Entity('payments')
@Index('idx_payments_booking', ['bookingId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  /** Fix 9: decimal transformer ensures amount is always a JS number */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.MANUAL,
  })
  provider: PaymentProvider;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  paidAt: Date;

  /**
   * Fix 11: eager-load booking so payment.booking.userId is always available
   * in PaymentsService without a separate query.
   */
  @OneToOne(() => Booking, (booking) => booking.payment, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
