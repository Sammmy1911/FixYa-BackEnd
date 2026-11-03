import {Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn,ManyToOne,JoinColumn,type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { TechnicianProfile } from '../../users/entities/technician-profile.entity.js';
import { Category } from '../../categories/entities/category.entity.js';
import { ServiceStatus } from '../../common/enums/service-status.enum.js';

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  address: string;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING,
  })
  status: ServiceStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.serviceRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Relation<User>;

  @ManyToOne(() => TechnicianProfile, (profile) => profile.assignedRequests, { nullable: true })
  @JoinColumn({ name: 'technician_id' })
  technician: Relation<TechnicianProfile>;

  @ManyToOne(() => Category, (category) => category.serviceRequests)
  @JoinColumn({ name: 'category_id' })
  category: Relation<Category>;
}