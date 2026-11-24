import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';
import { ServiceRequest } from '../service-requests/entities/service-request.entity.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';
import { HOW_IT_WORKS } from './landing.constants.js';

@Injectable()
export class LandingService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(TechnicianProfile)
    private readonly technicians: Repository<TechnicianProfile>,
    @InjectRepository(ServiceRequest)
    private readonly requests: Repository<ServiceRequest>,
  ) {}

  async getLanding() {
    const [services, verifiedTechnicians, completedServices] = await Promise.all([
      this.categories.find({ order: { name: 'ASC' } }),
      this.technicians.count({ where: { isVerified: true } }),
      this.requests.count({ where: { status: ServiceStatus.COMPLETED } }),
    ]);

    return {
      services: services.map(({ id, name, description }) => ({ id, name, description })),
      howItWorks: HOW_IT_WORKS,
      trust: { verifiedTechnicians, completedServices },
    };
  }
}
