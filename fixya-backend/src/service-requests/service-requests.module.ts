import { NotificationsModule } from '../notifications/notifications.module.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequestsService } from './service-requests.service.js';
import { ServiceRequestsController } from './service-requests.controller.js';
import { ServiceRequest } from './entities/service-request.entity.js';
import { RequestRejection } from './entities/request-rejection.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { AuthModule } from '../auth/auth.module.js';
@Module({ imports: [TypeOrmModule.forFeature([ServiceRequest, RequestRejection, TechnicianProfile, Category]), AuthModule, NotificationsModule],
  controllers: [ServiceRequestsController], providers: [ServiceRequestsService], exports: [ServiceRequestsService] })
export class ServiceRequestsModule {}
