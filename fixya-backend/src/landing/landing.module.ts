import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandingController } from './landing.controller.js';
import { LandingService } from './landing.service.js';
import { Category } from '../categories/entities/category.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';
import { ServiceRequest } from '../service-requests/entities/service-request.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Category, TechnicianProfile, ServiceRequest])],
  controllers: [LandingController],
  providers: [LandingService],
})
export class LandingModule {}
