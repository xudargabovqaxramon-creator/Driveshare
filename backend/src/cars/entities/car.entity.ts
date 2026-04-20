import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

export enum CarStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  MAINTENANCE = 'maintenance',
}

@Entity('cars')
// Fix 16: index on ownerId to speed up findByOwner / ownership checks
@Index('idx_cars_owner', ['ownerId'])
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 100 })
  brand: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Fix 9: decimal transformer coerces the Postgres string into a JS number.
   * Fix: was 'simple-array' for images — changed to 'jsonb' (see below).
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  pricePerDay: number;

  @Column({
    type: 'enum',
    enum: CarStatus,
    default: CarStatus.AVAILABLE,
  })
  status: CarStatus;

  /**
   * Fix 8: 'simple-array' serialises to a comma-separated string, which breaks
   * for URLs containing commas and provides no type safety.  'jsonb' stores a
   * real JSON array and queries/updates correctly.
   */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  images: string[];

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  seats: number;

  @Column({ nullable: true })
  transmission: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User, (user) => user.cars, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => Booking, (booking) => booking.car)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** Soft-delete: set via carRepository.softDelete(id) */
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
