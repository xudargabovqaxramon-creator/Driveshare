import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';
import { Car, CarStatus } from '../../cars/entities/car.entity';
import { Booking, BookingStatus } from '../../bookings/entities/booking.entity';
import { Payment, PaymentProvider, PaymentStatus } from '../../payments/entities/payment.entity';
import { AuditLog } from '../../audit-log/entities/audit-log.entity';
import { Notification } from '../../notifications/entities/notification.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'car_rental_db',
  // AuditLog va Notification ham qo'shildi
  entities: [User, Car, Booking, Payment, AuditLog, Notification],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Seeding database...');

  const userRepo    = AppDataSource.getRepository(User);
  const carRepo     = AppDataSource.getRepository(Car);
  const bookingRepo = AppDataSource.getRepository(Booking);
  const paymentRepo = AppDataSource.getRepository(Payment);

  // Mavjud ma'lumotlarni tozalash (FK constraint tartibida)
  // delete({}) TypeORM da ishlamaydi — clear() ishlatamiz
  await paymentRepo.query('TRUNCATE TABLE payments CASCADE');
  await bookingRepo.query('TRUNCATE TABLE bookings CASCADE');
  await carRepo.query('TRUNCATE TABLE cars CASCADE');
  await userRepo.query('TRUNCATE TABLE users CASCADE');

  // ── Foydalanuvchilar ───────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  const admin = userRepo.create({
    name: 'Admin User',
    email: 'admin@carrental.com',
    password: hashedPassword,
    roles: [UserRole.ADMIN],
  });

  const lessor1 = userRepo.create({
    name: 'Alice Lessor',
    email: 'alice@carrental.com',
    password: hashedPassword,
    roles: [UserRole.LESSOR],
  });

  const lessor2 = userRepo.create({
    name: 'Bob Lessor',
    email: 'bob@carrental.com',
    password: hashedPassword,
    roles: [UserRole.LESSOR],
  });

  const user1 = userRepo.create({
    name: 'Charlie User',
    email: 'charlie@carrental.com',
    password: hashedPassword,
    roles: [UserRole.USER],
  });

  const user2 = userRepo.create({
    name: 'Diana User',
    email: 'diana@carrental.com',
    password: hashedPassword,
    roles: [UserRole.USER],
  });

  await userRepo.save([admin, lessor1, lessor2, user1, user2]);
  console.log('✅ Users seeded');

  // ── Avtomobillar ───────────────────────────────────────────────────────────
  const cars = carRepo.create([
    {
      name: 'Model S',
      brand: 'Tesla',
      description: 'Luxury electric sedan with autopilot.',
      pricePerDay: 180,
      status: CarStatus.AVAILABLE,
      location: 'New York',
      year: 2023,
      seats: 5,
      transmission: 'automatic',
      ownerId: lessor1.id,
      images: [],
    },
    {
      name: 'Camry XSE',
      brand: 'Toyota',
      description: 'Reliable mid-size sedan.',
      pricePerDay: 75,
      status: CarStatus.AVAILABLE,
      location: 'Los Angeles',
      year: 2022,
      seats: 5,
      transmission: 'automatic',
      ownerId: lessor1.id,
      images: [],
    },
    {
      name: 'Mustang GT',
      brand: 'Ford',
      description: 'American muscle car – pure thrill.',
      pricePerDay: 140,
      status: CarStatus.AVAILABLE,
      location: 'Miami',
      year: 2023,
      seats: 4,
      transmission: 'manual',
      ownerId: lessor2.id,
      images: [],
    },
    {
      name: 'GLE 350',
      brand: 'Mercedes',
      description: 'Premium SUV with all the comforts.',
      pricePerDay: 220,
      status: CarStatus.AVAILABLE,
      location: 'Chicago',
      year: 2023,
      seats: 7,
      transmission: 'automatic',
      ownerId: lessor2.id,
      images: [],
    },
    {
      name: 'Civic Sport',
      brand: 'Honda',
      description: 'Compact and fuel-efficient city car.',
      pricePerDay: 55,
      status: CarStatus.MAINTENANCE,
      location: 'San Francisco',
      year: 2022,
      seats: 5,
      transmission: 'automatic',
      ownerId: lessor1.id,
      images: [],
    },
  ]);

  await carRepo.save(cars);
  console.log('✅ Cars seeded');

  // ── Bronlar ────────────────────────────────────────────────────────────────
  const booking1 = bookingRepo.create({
    userId: user1.id,
    carId: cars[0].id,
    startDate: new Date('2025-07-01'),
    endDate: new Date('2025-07-05'),
    totalPrice: 720,
    status: BookingStatus.APPROVED,
    notes: 'Please have the car ready by 9am',
  });

  const booking2 = bookingRepo.create({
    userId: user2.id,
    carId: cars[2].id,
    startDate: new Date('2025-07-10'),
    endDate: new Date('2025-07-12'),
    totalPrice: 280,
    status: BookingStatus.PENDING,
  });

  const booking3 = bookingRepo.create({
    userId: user1.id,
    carId: cars[1].id,
    startDate: new Date('2025-08-01'),
    endDate: new Date('2025-08-07'),
    totalPrice: 525,
    status: BookingStatus.COMPLETED,
  });

  await bookingRepo.save([booking1, booking2, booking3]);
  console.log('✅ Bookings seeded');

  // ── To'lovlar ──────────────────────────────────────────────────────────────
  const payment1 = paymentRepo.create({
    bookingId: booking1.id,
    amount: 720,
    status: PaymentStatus.COMPLETED,
    provider: PaymentProvider.STRIPE,
    transactionId: 'txn_seed_001',
    paidAt: new Date(),
  });

  const payment3 = paymentRepo.create({
    bookingId: booking3.id,
    amount: 525,
    status: PaymentStatus.COMPLETED,
    provider: PaymentProvider.PAYPAL,
    transactionId: 'txn_seed_002',
    paidAt: new Date(),
  });

  await paymentRepo.save([payment1, payment3]);
  console.log('✅ Payments seeded');

  console.log('\n🎉 Seed tugadi! Login ma\'lumotlari:');
  console.log('   Admin  → admin@carrental.com   / Password123!');
  console.log('   Lessor → alice@carrental.com   / Password123!');
  console.log('   Lessor → bob@carrental.com     / Password123!');
  console.log('   User   → charlie@carrental.com / Password123!');
  console.log('   User   → diana@carrental.com   / Password123!\n');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed muvaffaqiyatsiz:', err);
  process.exit(1);
});
