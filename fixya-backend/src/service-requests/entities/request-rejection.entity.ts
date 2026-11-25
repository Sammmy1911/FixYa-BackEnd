import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import type { ServiceRequest } from './service-request.entity.js';
import type { TechnicianProfile } from '../../users/entities/technician-profile.entity.js';

@Entity('service_request_rejections')
@Index(['request', 'technician'], { unique: true })
export class RequestRejection {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne('ServiceRequest', { onDelete: 'CASCADE' }) @JoinColumn({ name: 'request_id' }) request: Relation<ServiceRequest>;
  @ManyToOne('TechnicianProfile', { onDelete: 'CASCADE' }) @JoinColumn({ name: 'technician_id' }) technician: Relation<TechnicianProfile>;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
