import { BadRequestException, ConflictException, ForbiddenException, Logger, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity.js';
import { RequestRejection } from './entities/request-rejection.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';
import { CreateServiceRequestDto } from './dto/create-service-request.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { STATUS_LABEL } from './status-transitions.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);
  constructor(
    @InjectRepository(ServiceRequest) private readonly requests: Repository<ServiceRequest>,
    @InjectRepository(RequestRejection) private readonly rejections: Repository<RequestRejection>,
    @InjectRepository(TechnicianProfile) private readonly profiles: Repository<TechnicianProfile>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    private readonly notifications: NotificationsService,
  ) {}

private async notifyStatus(id: string, status: ServiceStatus) {
    try {
      const request = await this.requests.findOne({ where: { id }, relations: { client: true, technician: { user: true } } });
      if (!request) return;
      const recipients = new Set([request.client?.id, request.technician?.user?.id].filter((value): value is string => Boolean(value)));
      const message = `Tu servicio (${id.slice(0, 8)}) cambio a estado: ${STATUS_LABEL[status]}`;
      for (const recipient of recipients) {
        try { await this.notifications.notifyInApp(recipient, message, id); }
        catch (error) { this.logger.error('No se pudo guardar una notificacion interna', error); }
      }
    } catch (error) { this.logger.error('No se pudo consultar el servicio para notificar', error); }
  }

  private async technicianFor(userId: string) {
    const profile = await this.profiles.findOne({ where: { user: { id: userId } } });
    if (!profile) throw new ForbiddenException('No tienes perfil de técnico');
    if (!profile.isVerified) throw new ForbiddenException('Tu perfil técnico aún no está verificado');
    return profile;
  }

  async getAvailability(userId: string) {
    const profile = await this.technicianFor(userId);
    return { autoAvailable: profile.autoAvailable, coverageZones: profile.coverageZones, coverageCategories: profile.coverageCategories };
  }

  async setAvailability(userId: string, input: UpdateAvailabilityDto) {
    const profile = await this.technicianFor(userId);
    const coverageZones = [...new Set(input.coverageZones.map(zone => zone.trim().replace(/\s+/g, ' ').toLowerCase()).filter(Boolean))];
    const coverageCategories = [...new Set(input.coverageCategories)];
    if (input.autoAvailable && (!coverageZones.length || !coverageCategories.length)) {
      throw new BadRequestException('Selecciona al menos un barrio y una categoría');
    }
    for (const id of coverageCategories) {
      if (!await this.categories.findOneBy({ id })) throw new BadRequestException('Categoría inválida');
    }
    const values = { autoAvailable: input.autoAvailable, coverageZones, coverageCategories };
    const result = await this.profiles.update({ id: profile.id, isVerified: true }, values);
    if (result.affected !== 1) throw new ForbiddenException('Perfil no autorizado');
    return values;
  }

  // A recommendation is advisory, calculated from current data, never a reservation.
  // The existing conditional UPDATE in accept() is the only definitive assignment.
  private async recommendations(ids: string[]): Promise<Map<string, string>> {
    if (!ids.length) return new Map();
    const rows: { request_id: string; technician_id: string }[] = await this.requests.query(`
      SELECT r.id AS request_id, candidate.id AS technician_id
      FROM service_requests r
      CROSS JOIN LATERAL (
        SELECT p.id
        FROM technician_profiles p
        JOIN users u ON u.id = p.user_id AND u.role = 'technician'
        WHERE p.is_verified AND p.auto_available
          AND r.category_id = ANY(p.coverage_categories)
          AND EXISTS (SELECT 1 FROM unnest(p.coverage_zones) AS zone(name)
            WHERE translate(lower(regexp_replace(btrim(zone.name), '\\s+', ' ', 'g')), 'áéíóúüñ', 'aeiouun') =
                  translate(lower(regexp_replace(btrim(r.neighborhood), '\\s+', ' ', 'g')), 'áéíóúüñ', 'aeiouun'))
          AND NOT EXISTS (SELECT 1 FROM service_requests active
            WHERE active.technician_id = p.id AND active.status IN ('accepted', 'in_progress'))
          AND NOT EXISTS (SELECT 1 FROM service_request_rejections rejection
            WHERE rejection.request_id = r.id AND rejection.technician_id = p.id)
        ORDER BY (SELECT max(previous.updated_at) FROM service_requests previous
                  WHERE previous.technician_id = p.id) ASC NULLS FIRST, p.id ASC
        LIMIT 1
      ) candidate
      WHERE r.id = ANY($1::uuid[]) AND r.status = 'pending' AND r.technician_id IS NULL
        AND r.neighborhood IS NOT NULL AND btrim(r.neighborhood) <> ''
    `, [ids]);
    return new Map(rows.map(row => [row.request_id, row.technician_id]));
  }

  async createForClient(userId: string, input: CreateServiceRequestDto) {
    const category = await this.categories.findOneBy({ id: input.categoryId });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    const request = await this.requests.save(this.requests.create({
      description: input.description.trim(), address: input.address.trim(),
      neighborhood: input.neighborhood?.trim() || null, phone: input.phone || null,
      urgency: input.urgency || 'asap', category,
      status: ServiceStatus.PENDING, client: { id: userId } as User,
    }));
    const recommended = await this.recommendations(request.id ? [request.id] : []);
    return { ...request, hasRecommendation: recommended.has(request.id) };
  }

  async listForClient(userId: string) {
    const requests = await this.requests.find({ where: { client: { id: userId } },
      relations: { category: true, technician: { user: true } }, order: { createdAt: 'DESC' } });
    const recommended = await this.recommendations(requests.filter(r => r.status === ServiceStatus.PENDING).map(r => r.id));
    const completedIds = requests.filter(r => r.status === ServiceStatus.COMPLETED).map(r => r.id);
    const reviewed = new Set<string>();
    const warranties = new Map<string, string>();
    if (completedIds.length) {
      const reviews: { id: string }[] = await this.requests.query('SELECT service_request_id AS id FROM reviews WHERE service_request_id = ANY($1::uuid[])', [completedIds]);
      const claims: { original: string; id: string }[] = await this.requests.query('SELECT warranty_of_id AS original, id FROM service_requests WHERE warranty_of_id = ANY($1::uuid[])', [completedIds]);
      reviews.forEach(row => reviewed.add(row.id));
      claims.forEach(row => warranties.set(row.original, row.id));
    }
    return requests.map(request => ({ ...this.publicRequest(request), hasRecommendation: recommended.has(request.id), hasReview: reviewed.has(request.id), warrantyRequestId: warranties.get(request.id) ?? null }));
  }

  // Explicit DTO: never serialize password hashes or private technician documents.
  private publicRequest(request: ServiceRequest) {
    const tech = request.technician;
    return {
      id: request.id, status: request.status, description: request.description,
      address: request.address, neighborhood: request.neighborhood, phone: request.phone,
      urgency: request.urgency, createdAt: request.createdAt, updatedAt: request.updatedAt,
      completedAt: request.completedAt ?? null, paidAmount: request.paidAmount ?? null, warrantyOfId: request.warrantyOfId ?? null,
      category: request.category ? { id: request.category.id, name: request.category.name } : null,
      technician: tech ? { id: tech.id, fullName: tech.user?.fullName, phone: tech.user?.phone } : null,
    };
  }

  async listForAdmin() {
    const requests = await this.requests.find({
      relations: { category: true, technician: { user: true } }, order: { createdAt: 'DESC' },
    });
    return requests.map(request => this.publicRequest(request));
  }

  async requestWarranty(userId: string, id: string, reason: string) {
    const text = reason.trim();
    if (text.length < 10 || text.length > 500) throw new BadRequestException('Explica el motivo en 10 a 500 caracteres');
    const result = await this.requests.manager.transaction(async manager => {
      const repo = manager.getRepository(ServiceRequest);
      const locked = await repo.createQueryBuilder('request')
        .where('request.id = :id AND request.client_id = :userId', { id, userId })
        .setLock('pessimistic_write').getOne();
      if (!locked) throw new NotFoundException('Servicio no encontrado');
      if (locked.status !== ServiceStatus.COMPLETED) throw new ConflictException('Solo puedes pedir garantia de un servicio completado');
      if (locked.warrantyOfId) throw new ConflictException('Contacta soporte para dar seguimiento a esta garantia');
      if (await repo.findOneBy({ warrantyOfId: id })) throw new ConflictException('Ya solicitaste garantia para este servicio');
      const original = await repo.findOne({ where: { id }, relations: { category: true } });
      if (!original?.category) throw new ConflictException('El servicio no tiene categoria disponible');
      const claim = await repo.save(repo.create({
        client: { id: userId } as User, category: original.category, status: ServiceStatus.PENDING,
        description: `Garantia del servicio ${id}: ${text}`, address: original.address,
        neighborhood: original.neighborhood, phone: original.phone, urgency: 'asap', warrantyOfId: id,
      }));
      return { id: claim.id, status: claim.status };
    });
    try { await this.notifications.notifyInApp(userId, 'Recibimos tu solicitud de garantia. Te asignaremos un tecnico lo antes posible.', result.id); }
    catch (error) { this.logger.error('No se pudo guardar el aviso de garantia', error); }
    return result;
  }

  async reportPaidAmount(userId: string, id: string, amount: number) {
    const result = await this.requests.createQueryBuilder().update(ServiceRequest).set({ paidAmount: amount })
      .where('id = :id', { id }).andWhere('client_id = :userId', { userId })
      .andWhere('status = :status', { status: ServiceStatus.COMPLETED }).execute();
    if (result.affected !== 1) throw new ConflictException('Solo puedes registrar el valor de un servicio propio completado');
    return { id, paidAmount: amount };
  }

  async cancelForClient(userId: string, id: string) {
    const result = await this.requests.createQueryBuilder().update(ServiceRequest)
      .set({ status: ServiceStatus.CANCELLED })
      .where('id = :id', { id }).andWhere('client_id = :userId', { userId })
      .andWhere('status = :status', { status: ServiceStatus.PENDING })
      .andWhere('technician_id IS NULL').execute();
    if (result.affected !== 1) throw new ConflictException('No puedes cancelar una solicitud inexistente, ajena o ya tomada');
    await this.notifyStatus(id, ServiceStatus.CANCELLED);
    return { id, status: ServiceStatus.CANCELLED };
  }

  async available(userId: string) {
    const technician = await this.technicianFor(userId);
    const requests = await this.requests.createQueryBuilder('request')
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
    const recommended = await this.recommendations(requests.map(r => r.id));
    return requests.map(request => ({ ...request, recommendedForMe: recommended.get(request.id) === technician.id }))
      .sort((a, b) => Number(b.recommendedForMe) - Number(a.recommendedForMe));
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
      .andWhere('EXISTS (SELECT 1 FROM technician_profiles p WHERE p.id = :technicianId AND p.is_verified = true)', { technicianId: technician.id })
      .andWhere(`NOT EXISTS (SELECT 1 FROM service_request_rejections r
        WHERE r.request_id = :requestId AND r.technician_id = :technicianId)`,
        { technicianId: technician.id }).execute();
    if (result.affected !== 1) throw new ConflictException('La solicitud ya no está disponible o fue rechazada');
    await this.notifyStatus(requestId, ServiceStatus.ACCEPTED);
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
      .set({ status: target, ...(target === ServiceStatus.COMPLETED ? { completedAt: new Date() } : {}) }).where('id = :requestId', { requestId })
      .andWhere('technician_id = :technicianId', { technicianId: technician.id })
      .andWhere('status = :current', { current }).execute();
    if (result.affected !== 1) throw new ConflictException('Transición inválida o solicitud no asignada');
    await this.notifyStatus(requestId, target);
    return { id: requestId, status: target };
  }
}
