import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  IsFutureOrToday,
  IsAfterDate,
  MinRentalDays,
} from '../../common/validators/date-range.validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-of-car' })
  @IsUUID()
  carId: string;

  /**
   * ISO-8601 date (YYYY-MM-DD). Must be today or a future date.
   */
  @ApiProperty({ example: '2025-08-01' })
  @IsDateString({}, { message: 'startDate must be a valid ISO date (YYYY-MM-DD)' })
  @IsFutureOrToday()
  startDate: string;

  /**
   * ISO-8601 date (YYYY-MM-DD). Must be strictly after startDate with ≥1 day gap.
   */
  @ApiProperty({ example: '2025-08-07' })
  @IsDateString({}, { message: 'endDate must be a valid ISO date (YYYY-MM-DD)' })
  @IsAfterDate('startDate')
  @MinRentalDays('startDate', 1)
  endDate: string;

  @ApiPropertyOptional({ example: 'Please have the car ready at 9am' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiPropertyOptional({ example: 'Car is not available on those dates' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class FilterBookingsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
