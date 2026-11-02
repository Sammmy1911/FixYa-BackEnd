import {Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn,OneToOne,OneToMany,
} from 'typeorm';
import { UserRole } from '../../common/enums/roles.enum';
import { TechnicianProfile } from './technician-profile.entity';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => TechnicianProfile, (profile) => profile.user, { cascade: true })
  technicianProfile: TechnicianProfile;

  @OneToMany(() => ServiceRequest, (request) => request.client)
  serviceRequests: ServiceRequest[];
}