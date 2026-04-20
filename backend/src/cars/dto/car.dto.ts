import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsPositive,
  IsArray,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CarStatus } from '../entities/car.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateCarDto {
  @ApiProperty({ example: 'Model S' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Tesla' })
  @IsString()
  brand: string;

  @ApiPropertyOptional({ example: 'A sleek electric sedan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  pricePerDay: number;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 2023 })
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  seats?: number;

  @ApiPropertyOptional({ example: 'automatic', enum: ['automatic', 'manual'] })
  @IsOptional()
  @IsString()
  transmission?: string;
}

export class UpdateCarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  pricePerDay?: number;

  @ApiPropertyOptional({ enum: CarStatus })
  @IsOptional()
  @IsEnum(CarStatus)
  status?: CarStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  seats?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transmission?: string;
}

export class FilterCarsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Tesla' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ enum: CarStatus })
  @IsOptional()
  @IsEnum(CarStatus)
  status?: CarStatus;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  minPrice?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'pricePerDay' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
