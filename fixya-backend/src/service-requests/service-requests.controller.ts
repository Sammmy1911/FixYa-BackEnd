import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service.js';
import { CreateServiceRequestDto } from './dto/create-service-request.dto.js';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  create(@Body() createServiceRequestDto: CreateServiceRequestDto) {
    return this.serviceRequestsService.create(createServiceRequestDto);
  }

  /** Métricas básicas para el panel del administrador. */
  @Get('admin/summary')
  getAdminSummary() {
    return this.serviceRequestsService.getAdminSummary();
  }

  /** Historial de un cliente por query (?clientId=uuid) o todas las solicitudes si no se envía clientId. */
  @Get()
  findAll(@Query('clientId') clientId?: string) {
    if (clientId) {
      return this.serviceRequestsService.findByClient(clientId);
    }
    return this.serviceRequestsService.findAll();
  }

  /** Detalle y estado de una solicitud por UUID. */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceRequestsService.findOne(id);
  }

  // TODO: proteger con JwtAuthGuard + RolesGuard cuando auth esté en develop (PR #3).
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.serviceRequestsService.updateStatus(id, dto.status);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceRequestDto: UpdateServiceRequestDto,
  ) {
    return this.serviceRequestsService.update(id, updateServiceRequestDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceRequestsService.remove(id);
  }
}