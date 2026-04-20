import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CarsModule } from './cars/cars.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadsModule } from './uploads/uploads.module';
import { RolesModule } from './roles/roles.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { NotificationsModule } from './notifications/notifications.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
    ...databaseConfig(configService),
    synchronize: true, // Mana shu yerda bo'lishi shart!
    autoLoadEntities: true, // Entitylarni avtomat topish uchun
  }),
    }),

    /**
     * Global rate-limiter defaults:
     *   - 100 requests per 60 s across all routes.
     * Individual routes can override with @Throttle({ default: { limit, ttl } }).
     */
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,   // 60 seconds
        limit: 100,
      },
    ]),

    AuthModule,
    UsersModule,
    RolesModule,
    CarsModule,
    BookingsModule,
    PaymentsModule,
    UploadsModule,
    AuditLogModule,
    NotificationsModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally so every route is rate-limited by default
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
