import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import type { Relation } from 'typeorm';
import type { User } from './user.entity.js';
import type { ServiceRequest } from '../../service-requests/entities/service-request.entity.js';

@Entity('technician_profiles')
export class TechnicianProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { array: true, nullable: true, name: 'documents_url' })
  documentsUrl: string[];

  @Column({ default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.0,
    name: 'rating_average',
  })
  ratingAverage: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(
    'User',
    (user: User) => user.technicianProfile,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @OneToMany(
    'ServiceRequest',
    (request: ServiceRequest) => request.technician,
  )
  assignedRequests: Relation<ServiceRequest[]>;
}
