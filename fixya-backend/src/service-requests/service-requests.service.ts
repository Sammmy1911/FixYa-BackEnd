import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';
import { UserRole } from '../common/enums/roles.enums.js';
import { ALLOWED_TRANSITIONS } from './status-transitions.js';
import { CreateServiceRequestDto } from './dto/create-service-request.dto.js';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto.js';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly requests: Repository<ServiceRequest>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  /** Cambia el estado de la solicitud validando las transiciones permitidas. */
  async updateStatus(id: string, status: ServiceStatus) {
    const request = await this.requests.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS[request.status] ?? [];
    if (!allowedNextStatuses.includes(status)) {
      throw new BadRequestException(
        `No se puede pasar de "${request.status}" a "${status}"`,
      );
    }

    request.status = status;
    await this.requests.save(request);

    return { id, status };
  }

  /** Historial y estado actual de servicios de un cliente. */
  async findByClient(clientId: string) {
    return this.requests.find({
      where: { client: { id: clientId } },
      relations: {
        category: true,
        technician: { user: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  /** Listado completo para el panel administrativo. */
  async findAll() {
    return this.requests.find({
      relations: {
        client: true,
        category: true,
        technician: { user: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  /** Detalle y estado de una solicitud específica por UUID. */
  async findOne(id: string) {
    const request = await this.requests.findOne({
      where: { id },
      relations: {
        client: true,
        category: true,
        technician: { user: true },
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    return request;
  }

  /** Métricas básicas para el panel del administrador. */
  async getAdminSummary() {
    const allRequests = await this.requests.find({
      relations: { technician: true },
    });

    const byStatus: Record<string, number> = {};
    for (const statusValue of Object.values(ServiceStatus)) {
      byStatus[statusValue] = 0;
    }

    let unassignedRequests = 0;

    for (const req of allRequests) {
      byStatus[req.status] = (byStatus[req.status] ?? 0) + 1;
      if (!req.technician) {
        unassignedRequests += 1;
      }
    }

    const technicians = await this.users.find({
      where: { role: UserRole.TECHNICIAN },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });

    return {
      totalRequests: allRequests.length,
      unassignedRequests,
      totalTechnicians: technicians.length,
      technicians,
      byStatus,
    };
  }

  create(_createServiceRequestDto: CreateServiceRequestDto) {
    return 'This action adds a new serviceRequest';
  }

  update(id: string, _updateServiceRequestDto: UpdateServiceRequestDto) {
    return `This action updates a #${id} serviceRequest`;
  }

  remove(id: string) {
    return `This action removes a #${id} serviceRequest`;
  }
}