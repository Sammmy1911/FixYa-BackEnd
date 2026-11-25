import { BadRequestException, Body, Controller, Get, Patch, Post, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ServiceRequestsService } from './service-requests.service.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';
import { CreateServiceRequestDto } from './dto/create-service-request.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../common/enums/roles.enums.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { WarrantyRequestDto, PaidAmountDto } from './dto/history-actions.dto.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';
type AuthRequest = Request & { user: { userId: string; role: UserRole } };

@Controller('service-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceRequestsController {
  constructor(private readonly service: ServiceRequestsService) {}
  @Post() @Roles(UserRole.CLIENT)
  create(@Req() req: AuthRequest, @Body() dto: CreateServiceRequestDto) { return this.service.createForClient(req.user.userId, dto); }
  @Get('admin/all') @Roles(UserRole.ADMIN)
  adminAll() { return this.service.listForAdmin(); }
  @Get('mine') @Roles(UserRole.CLIENT)
  mineClient(@Req() req: AuthRequest) { return this.service.listForClient(req.user.userId); }
  @Post(':id/warranty') @Roles(UserRole.CLIENT)
  warranty(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: WarrantyRequestDto) {
    return this.service.requestWarranty(req.user.userId, id, dto.reason);
  }
  @Patch(':id/paid-amount') @Roles(UserRole.CLIENT)
  paidAmount(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PaidAmountDto) {
    return this.service.reportPaidAmount(req.user.userId, id, dto.amount);
  }
  @Patch(':id/cancel') @Roles(UserRole.CLIENT)
  cancel(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) { return this.service.cancelForClient(req.user.userId, id); }
  @Get('technician/availability') @Roles(UserRole.TECHNICIAN)
  getAvailability(@Req() req: AuthRequest) { return this.service.getAvailability(req.user.userId); }
  @Patch('technician/availability') @Roles(UserRole.TECHNICIAN)
  setAvailability(@Req() req: AuthRequest, @Body() dto: UpdateAvailabilityDto) { return this.service.setAvailability(req.user.userId, dto); }
  @Get('technician/available') @Roles(UserRole.TECHNICIAN)
  available(@Req() req: AuthRequest) { return this.service.available(req.user.userId); }
  @Get('technician/mine') @Roles(UserRole.TECHNICIAN)
  mineTech(@Req() req: AuthRequest) { return this.service.mine(req.user.userId); }
  @Patch('technician/:id/accept') @Roles(UserRole.TECHNICIAN)
  accept(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) { return this.service.accept(id, req.user.userId); }
  @Patch('technician/:id/reject') @Roles(UserRole.TECHNICIAN)
  reject(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) { return this.service.reject(id, req.user.userId); }
  @Patch(':id/status') @Roles(UserRole.TECHNICIAN)
  changeStatus(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest, @Body() dto: UpdateStatusDto) {
    if (dto.status === ServiceStatus.ACCEPTED) return this.service.accept(id, req.user.userId);
    if (dto.status === ServiceStatus.IN_PROGRESS || dto.status === ServiceStatus.COMPLETED) return this.service.updateProgress(id, req.user.userId, dto.status);
    throw new BadRequestException('Transición no permitida para técnico');
  }
  @Patch('technician/:id/start') @Roles(UserRole.TECHNICIAN)
  start(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) { return this.service.updateProgress(id, req.user.userId, ServiceStatus.IN_PROGRESS); }
  @Patch('technician/:id/complete') @Roles(UserRole.TECHNICIAN)
  complete(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) { return this.service.updateProgress(id, req.user.userId, ServiceStatus.COMPLETED); }
}
