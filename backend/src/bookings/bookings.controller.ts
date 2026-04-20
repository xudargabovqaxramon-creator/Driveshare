import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  FilterBookingsDto,
} from './dto/booking.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Bookings')
@ApiBearerAuth('JWT-auth')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * Bug 4 fix: LESSOR role added to create booking.
   * A LESSOR may also be a renter — they can have USER+LESSOR roles.
   * Restricting to USER-only would block multi-role users from booking.
   * The service uses the authenticated user's id, never a user-supplied id.
   */
  @Post()
  @Roles(UserRole.USER, UserRole.LESSOR, UserRole.ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  @ApiResponse({ status: 409, description: 'Car already booked for those dates' })
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: User) {
    return this.bookingsService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bookings (ADMIN only)' })
  findAll(@Query() filters: FilterBookingsDto) {
    return this.bookingsService.findAll(filters);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my bookings' })
  getMyBookings(
    @CurrentUser() user: User,
    @Query() filters: FilterBookingsDto,
  ) {
    return this.bookingsService.findMyBookings(user.id, filters);
  }

  @Get('my-cars')
  @Roles(UserRole.LESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get bookings for my car listings (LESSOR)' })
  getBookingsForMyCars(
    @CurrentUser() user: User,
    @Query() filters: FilterBookingsDto,
  ) {
    return this.bookingsService.findBookingsForMyCars(user.id, filters);
  }

  /**
   * Ownership enforced inside service via findOneWithOwnershipCheck:
   * - USER   → own bookings only
   * - LESSOR → bookings for their cars
   * - ADMIN  → any booking
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID (ownership enforced)' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.findOneWithOwnershipCheck(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status (role + ownership enforced in service)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.updateStatus(id, dto, user);
  }

  /**
   * Ownership enforced in service: only booking owner or ADMIN may cancel.
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel own booking' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.cancel(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a booking (owner or ADMIN)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.softRemove(id, user);
  }
}
