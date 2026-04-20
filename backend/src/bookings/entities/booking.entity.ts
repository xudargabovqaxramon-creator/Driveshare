import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Car } from '../../cars/entities/car.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

export enum BookingStatus {
  PENDING = 'pending',
  /**
   * Lessor has reviewed the request and is waiting for the user's payment.
   * The car remains AVAILABLE until payment succeeds.
   */
  AWAITING_PAYMENT = 'awaiting_payment',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

/**
 * Terminal states — once a booking reaches one of these it can never
 * be transitioned again (enforced in BookingsService.validateStatusTransition).
 */
export const TERMINAL_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.REJECTED,
  BookingStatus.CANCELLED,
  BookingStatus.COMPLETED,
];

@Entity('bookings')
/**
 * Fix 10+16: composite index on (carId, status, startDate, endDate).
 * The overlap query in BookingsService filters on all four columns, so this
 * index is hit on every booking-creation conflict check.
 */
@Index('idx_bookings_overlap', ['carId', 'status', 'startDate', 'endDate'])
@Index('idx_bookings_user', ['userId'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  carId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  /** Fix 9: decimal transformer so totalPrice is always a JS number */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Car, (car) => car.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carId' })
  car: Car;

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment: Payment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
