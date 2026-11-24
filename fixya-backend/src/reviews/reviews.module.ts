import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import { Review } from './entities/review.entity.js';
import { ServiceRequest } from '../service-requests/entities/service-request.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ServiceRequest, TechnicianProfile])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
