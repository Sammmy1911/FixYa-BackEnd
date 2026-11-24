import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ALLOWED_TRANSITIONS, STATUS_LABEL } from './status-transitions.js';
import { CreateServiceRequestDto } from './dto/create-service-request.dto.js';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto.js';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest) private readonly requests: Repository<ServiceRequest>,
    private readonly notifications: NotificationsService,
  ) {}

  /** Cambia el estado (solo transiciones válidas) y notifica por WhatsApp a cliente y técnico. */
  async updateStatus(id: string, status: ServiceStatus) {
    const request = await this.requests.findOne({
      where: { id },
      relations: { client: true, technician: { user: true } },
    });
    if (!request) throw new NotFoundException('Servicio no encontrado');
    if (!ALLOWED_TRANSITIONS[request.status].includes(status)) {
      throw new BadRequestException(
        `No se puede pasar de "${request.status}" a "${status}"`,
      );
    }

    request.status = status;
    await this.requests.save(request);

    const message = `Tu servicio cambió a estado: ${STATUS_LABEL[status]}`;
    await this.notifications.notify(request.client.phone, message, id);
    if (request.technician) {
      await this.notifications.notify(request.technician.user.phone, message, id);
    }
    return { id, status };
  }

  create(createServiceRequestDto: CreateServiceRequestDto) {
    return 'This action adds a new serviceRequest';
  }

  findAll() {
    return `This action returns all serviceRequests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} serviceRequest`;
  }

  update(id: number, updateServiceRequestDto: UpdateServiceRequestDto) {
    return `This action updates a #${id} serviceRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} serviceRequest`;
  }
}
