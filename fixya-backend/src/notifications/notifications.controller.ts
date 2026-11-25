import { Controller, Get, Patch, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../common/enums/roles.enums.js';
import type { Request } from 'express';
type AuthRequest = Request & { user: { userId: string; role: UserRole } };

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get('mine') @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  mine(@Req() req: AuthRequest) { return this.notifications.mine(req.user.userId); }
  @Patch(':id/read') @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  read(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) { return this.notifications.markRead(req.user.userId, id); }
  @Get() @Roles(UserRole.ADMIN)
  findAll() { return this.notifications.findAll(); }
}
