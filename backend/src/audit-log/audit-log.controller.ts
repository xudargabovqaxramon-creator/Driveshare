import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('entity/:entity/:entityId')
  @ApiOperation({ summary: 'Get audit trail for a specific record (ADMIN)' })
  findByEntity(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditLogService.findByEntity(entity, entityId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all actions by a user (ADMIN)' })
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.auditLogService.findByUser(userId);
  }
}
