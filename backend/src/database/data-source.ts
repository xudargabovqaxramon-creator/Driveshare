import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Car } from '../cars/entities/car.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Payment } from '../payments/entities/payment.entity';
import * as dotenv from 'dotenv';
import { Notification } from '../notifications/entities/notification.entity';
import { AuditLog } from '../audit-log/entities/audit-log.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'car_rental_db',
  entities: [User, Car, Booking, Payment, Notification, AuditLog],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
