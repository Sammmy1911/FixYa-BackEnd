import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ServiceRequestsService } from './service-requests.service.js';
import { ServiceRequestsController } from './service-requests.controller.js';

import { ServiceRequest } from './entities/service-request.entity.js';
import { Category } from '../categories/entities/category.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceRequest,
      Category,
    ]),
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}