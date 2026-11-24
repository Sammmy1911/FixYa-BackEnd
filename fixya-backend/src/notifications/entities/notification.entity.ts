import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity.js';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ServiceRequest, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_request_id' })
  serviceRequest: Relation<ServiceRequest> | null;
}
