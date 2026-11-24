import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ServiceRequestsService } from './service-requests.service.js';
import { ServiceRequestsController } from './service-requests.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

import { ServiceRequest } from './entities/service-request.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { User } from '../users/entities/user.entity.js';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([
      ServiceRequest,
      Category,
      User,
    ]),
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}