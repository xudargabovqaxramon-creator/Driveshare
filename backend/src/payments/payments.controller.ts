import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentStatusDto } from './dto/payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Fix 3a: currentUser injected — service verifies booking.userId === currentUser.id.
   * Fix 4: service validates dto.amount === booking.totalPrice.
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Initiate payment for your AWAITING_PAYMENT booking' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() currentUser: User) {
    return this.paymentsService.create(dto, currentUser);
  }

  /**
   * Fix 3b + Fix 15: currentUser injected for ownership check.
   * simulateFailure is blocked in production inside the service.
   */
  @Post(':id/process')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Process / confirm a payment (booking owner or ADMIN)' })
  @ApiQuery({
    name: 'simulateFailure',
    required: false,
    type: Boolean,
    description: 'Dev/test only — blocked in production',
  })
  process(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
    @Query('simulateFailure') simulateFailure?: boolean,
  ) {
    return this.paymentsService.processPayment(id, currentUser, simulateFailure);
  }

  /**
   * Fix 3c: currentUser passed so service can enforce read access.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID (booking owner or ADMIN)' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.paymentsService.findOne(id, currentUser);
  }

  /**
   * Fix 3d: currentUser passed so service can enforce read access.
   */
  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get payment for a booking (booking owner or ADMIN)' })
  findByBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.paymentsService.findByBooking(bookingId, currentUser);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually override payment status (ADMIN only)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.updateStatus(id, dto);
  }

  @Post(':id/refund')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Refund a completed payment (ADMIN only)' })
  refund(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.refund(id);
  }
}
