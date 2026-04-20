import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdatePasswordDto } from './dto/user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from './entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMyProfile(@CurrentUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (ADMIN only)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Self-update: any authenticated user may update their own name/email.
   * The service blocks attempts to set `roles` or `isActive` from non-admins.
   */
  @Patch('me')
  @ApiOperation({ summary: 'Update own profile (name, email)' })
  updateMe(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.id, updateUserDto, user);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change own password' })
  changePassword(
    @CurrentUser() user: User,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(user.id, dto, user);
  }

  /**
   * Admin update: can change name, email, roles, isActive for any user.
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update any user — including roles and isActive (ADMIN only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() requestingUser: User,
  ) {
    return this.usersService.update(id, updateUserDto, requestingUser);
  }

  /**
   * Bug 2 fix: @Roles(UserRole.ADMIN) added.
   * Previously any authenticated user could attempt to delete any other user —
   * the service guarded it, but the correct place to enforce this is at the
   * controller boundary so the restriction is visible and consistent.
   * Self-deletion (user deletes their own account) is intentionally disallowed
   * here; use PATCH /users/me to deactivate, or add a dedicated endpoint.
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (soft) any user (ADMIN only)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requestingUser: User,
  ) {
    return this.usersService.remove(id, requestingUser);
  }
}
