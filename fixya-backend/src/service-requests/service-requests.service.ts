import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity.js';
import { RequestRejection } from './entities/request-rejection.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { CreateServiceRequestDto } from './dto/create-service-request.dto.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest) private readonly requests: Repository<ServiceRequest>,
    @InjectRepository(RequestRejection) private readonly rejections: Repository<RequestRejection>,
    @InjectRepository(TechnicianProfile) private readonly profiles: Repository<TechnicianProfile>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
  ) {}

  private async technicianFor(userId: string) {
    const profile = await this.profiles.findOne({ where: { user: { id: userId } } });
    if (!profile) throw new ForbiddenException('No tienes perfil de técnico');
    if (!profile.isVerified) throw new ForbiddenException('Tu perfil técnico aún no está verificado');
    return profile;
  }

  async createForClient(userId: string, input: CreateServiceRequestDto) {
    const category = await this.categories.findOneBy({ id: input.categoryId });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return this.requests.save(this.requests.create({
      description: input.description.trim(), address: input.address.trim(), category,
      status: ServiceStatus.PENDING, client: { id: userId } as User,
    }));
  }

  listForClient(userId: string) {
    return this.requests.find({ where: { client: { id: userId } },
      relations: { category: true }, order: { createdAt: 'DESC' } });
  }

  async cancelForClient(userId: string, id: string) {
    const result = await this.requests.createQueryBuilder().update(ServiceRequest)
      .set({ status: ServiceStatus.CANCELLED })
      .where('id = :id', { id }).andWhere('client_id = :userId', { userId })
      .andWhere('status = :status', { status: ServiceStatus.PENDING })
      .andWhere('technician_id IS NULL').execute();
    if (result.affected !== 1) throw new ConflictException('No puedes cancelar una solicitud inexistente, ajena o ya tomada');
    return { id, status: ServiceStatus.CANCELLED };
  }

  async available(userId: string) {
    const technician = await this.technicianFor(userId);
    return this.requests.createQueryBuilder('request')
      .leftJoinAndSelect('request.category', 'category')
      .where('request.status = :status', { status: ServiceStatus.PENDING })
      .andWhere('request.technician_id IS NULL')
      .andWhere(qb => {
        const sql = qb.subQuery().select('1').from(RequestRejection, 'rejection')
          .where('rejection.request_id = request.id')
          .andWhere('rejection.technician_id = :technicianId').getQuery();
        return `NOT EXISTS ${sql}`;
      }).setParameter('technicianId', technician.id)
      .orderBy('request.createdAt', 'DESC').getMany();
  }

  async mine(userId: string) {
    const technician = await this.technicianFor(userId);
    return this.requests.find({ where: { technician: { id: technician.id } },
      relations: { category: true }, order: { createdAt: 'DESC' } });
  }

  async accept(requestId: string, userId: string) {
    const technician = await this.technicianFor(userId);
    // Atomic SQL: no other technician can take the same pending request.
    const result = await this.requests.createQueryBuilder().update(ServiceRequest)
      .set({ status: ServiceStatus.ACCEPTED, technician })
      .where('id = :requestId', { requestId })
      .andWhere('status = :pending', { pending: ServiceStatus.PENDING })
      .andWhere('technician_id IS NULL')
      .andWhere(`NOT EXISTS (SELECT 1 FROM service_request_rejections r
        WHERE r.request_id = :requestId AND r.technician_id = :technicianId)`,
        { technicianId: technician.id }).execute();
    if (result.affected !== 1) throw new ConflictException('La solicitud ya no está disponible o fue rechazada');
    return this.requests.findOne({ where: { id: requestId }, relations: { category: true } });
  }

  async reject(requestId: string, userId: string) {
    const technician = await this.technicianFor(userId);
    const request = await this.requests.findOne({ where: { id: requestId }, relations: { technician: true } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== ServiceStatus.PENDING || request.technician)
      throw new ConflictException('La solicitud ya no está disponible');
    await this.rejections.createQueryBuilder().insert()
      .values({ request: { id: requestId }, technician: { id: technician.id } })
      .orIgnore().execute();
    return { id: requestId, rejected: true };
  }

  async updateProgress(requestId: string, userId: string, target: ServiceStatus.IN_PROGRESS | ServiceStatus.COMPLETED) {
    const technician = await this.technicianFor(userId);
    const current = target === ServiceStatus.IN_PROGRESS ? ServiceStatus.ACCEPTED : ServiceStatus.IN_PROGRESS;
    const result = await this.requests.createQueryBuilder().update(ServiceRequest)
      .set({ status: target }).where('id = :requestId', { requestId })
      .andWhere('technician_id = :technicianId', { technicianId: technician.id })
      .andWhere('status = :current', { current }).execute();
    if (result.affected !== 1) throw new ConflictException('Transición inválida o solicitud no asignada');
    return { id: requestId, status: target };
  }
}
