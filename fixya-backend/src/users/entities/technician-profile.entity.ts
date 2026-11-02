import {Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,OneToOne,JoinColumn,OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';

@Entity('technician_profiles')
export class TechnicianProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { array: true, nullable: true, name: 'documents_url' })
  documentsUrl: string[];

  @Column({ default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0, name: 'rating_average' })
  ratingAverage: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => User, (user) => user.technicianProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => ServiceRequest, (request) => request.technician)
  assignedRequests: ServiceRequest[];
}