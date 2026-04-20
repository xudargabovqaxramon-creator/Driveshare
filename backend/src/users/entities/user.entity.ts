import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Car } from '../../cars/entities/car.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Notification } from '../../notifications/entities/notification.entity';

export enum UserRole {
  USER = 'USER',
  LESSOR = 'LESSOR',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.USER],
  })
  roles: UserRole[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Soft-delete timestamp. When set, TypeORM automatically excludes this row
   * from all standard queries. Use repo.softDelete() / repo.restore().
   */
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Car, (car) => car.owner)
  cars: Car[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];
}
