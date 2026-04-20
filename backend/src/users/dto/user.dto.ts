import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

/**
 * CreateUserDto — used only internally (e.g. seeding).
 * Never exposed on a public controller endpoint.
 * Role assignment here is intentional for admin/seed tooling only.
 */
export class CreateUserDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}

/**
 * UpdateUserDto — used by PATCH /users/me and PATCH /users/:id (ADMIN).
 *
 * Security notes:
 * - `roles`    → guarded in UsersService: only ADMIN may set this field.
 * - `isActive` → guarded in UsersService: only ADMIN may set this field.
 *   Both fields are present in the DTO so that the ADMIN PATCH /users/:id
 *   endpoint can use a single DTO; non-admins are rejected in the service
 *   before Object.assign() is called.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'new@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  /**
   * ADMIN-only — rejected by UsersService.update() for non-admins.
   */
  @ApiPropertyOptional({ enum: UserRole, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  /**
   * ADMIN-only — rejected by UsersService.update() for non-admins.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
