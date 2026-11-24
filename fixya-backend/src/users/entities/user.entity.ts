import {Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn,OneToOne,OneToMany,type Relation,
} from 'typeorm';
import { UserRole } from '../../common/enums/roles.enums.js';
import { TechnicianProfile } from './technician-profile.entity.js';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity.js';

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

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

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
  technicianProfile: Relation<TechnicianProfile>;

  @OneToMany(() => ServiceRequest, (request) => request.client)
  serviceRequests: ServiceRequest[];
}