import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ServiceRequest } from '../service-requests/entities/service-request.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(ServiceRequest) private readonly requests: Repository<ServiceRequest>,
    @InjectRepository(TechnicianProfile) private readonly profiles: Repository<TechnicianProfile>,
  ) {}

  /** El cliente dueño de un servicio COMPLETED lo reseña una única vez. */
  async create(clientId: string, requestId: string, dto: CreateReviewDto) {
    const request = await this.requests.findOne({
      where: { id: requestId },
      relations: { client: true, technician: true },
    });
    if (!request) throw new NotFoundException('Servicio no encontrado');
    if (request.client.id !== clientId) {
      throw new ForbiddenException('Solo el cliente del servicio puede reseñarlo');
    }
    if (request.status !== ServiceStatus.COMPLETED) {
      throw new BadRequestException('Solo se pueden reseñar servicios completados');
    }
    if (!request.technician) {
      throw new BadRequestException('El servicio no tiene técnico asignado');
    }
    if (await this.reviews.existsBy({ serviceRequest: { id: requestId } })) {
      throw new ConflictException('El servicio ya fue reseñado');
    }

    const review = await this.reviews.save(
      this.reviews.create({
        rating: dto.rating,
        comment: dto.comment ?? null,
        serviceRequest: { id: requestId },
        client: { id: clientId },
        technician: { id: request.technician.id },
      }),
    );
    await this.refreshRating(request.technician.id);
    return review;
  }

  findByTechnician(technicianId: string) {
    return this.reviews.find({
      where: { technician: { id: technicianId } },
      order: { createdAt: 'DESC' },
    });
  }

  /** Recalcula TechnicianProfile.ratingAverage (decimal 3,2) con el promedio real. */
  private async refreshRating(technicianId: string) {
    const raw = await this.reviews
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.technician_id = :technicianId', { technicianId })
      .getRawOne<{ avg: string | null }>();
    const average = Math.round(Number(raw?.avg ?? 0) * 100) / 100;
    await this.profiles.update(technicianId, { ratingAverage: average });
  }
}
