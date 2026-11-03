import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechniciansController } from './technicians.controller.js';
import { TechniciansService } from './technicians.service.js';
import { User } from '../users/entities/user.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, TechnicianProfile])],
  controllers: [TechniciansController],
  providers: [TechniciansService],
})
export class TechniciansModule {}
