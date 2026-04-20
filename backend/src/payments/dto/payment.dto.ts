import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsOptional, IsString, IsNumber, IsPositive } from 'class-validator';
import { PaymentProvider, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-of-booking' })
  @IsUUID()
  bookingId: string;

  @ApiProperty({ example: 450.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional({ example: 'txn_1234567890' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionId?: string;
}
