
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { ServiceStatus } from '../../common/enums/service-status.enum.js';

import type { User } from '../../users/entities/user.entity.js';
import type { TechnicianProfile } from '../../users/entities/technician-profile.entity.js';
import type { Category } from '../../categories/entities/category.entity.js';

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  neighborhood: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 16, default: 'asap' })
  urgency: string;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING,
  })
  status: ServiceStatus;

  @Column({ type: 'uuid', name: 'warranty_of_id', nullable: true, unique: true })
  warrantyOfId: string | null;

  @Column({ type: 'integer', name: 'paid_amount', nullable: true })
  paidAmount: number | null;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(
    'User',
    (user: User) => user.serviceRequests,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'client_id' })
  client: Relation<User>;

  @ManyToOne(
    'TechnicianProfile',
    (profile: TechnicianProfile) => profile.assignedRequests,
    { nullable: true },
  )
  @JoinColumn({ name: 'technician_id' })
  technician: Relation<TechnicianProfile>;

  @ManyToOne(
    'Category',
    (category: Category) => category.serviceRequests,
  )
  @JoinColumn({ name: 'category_id' })
  category: Relation<Category>;
}
