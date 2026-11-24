import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { TechnicianProfile } from '../../users/entities/technician-profile.entity.js';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity.js';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Una sola reseña por servicio (unique en la FK).
  @OneToOne(() => ServiceRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_request_id' })
  serviceRequest: Relation<ServiceRequest>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Relation<User>;

  @ManyToOne(() => TechnicianProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'technician_id' })
  technician: Relation<TechnicianProfile>;
}
