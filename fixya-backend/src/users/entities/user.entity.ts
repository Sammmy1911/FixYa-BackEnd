import {Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn,OneToOne,OneToMany,type Relation,
} from 'typeorm';
import { UserRole } from '../../common/enums/roles.enums.js';
import { TechnicianProfile } from './technician-profile.entity.js';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({ nullable: true })
  specialty?: string;

  // Ajuste en la relación para evitar error TS2339 si en ServiceRequest se llama 'client' o 'user'
  @OneToMany(() => ServiceRequest, (serviceRequest: any) => serviceRequest.user || serviceRequest.client)
  serviceRequests: ServiceRequest[];

  @OneToOne(() => TechnicianProfile, (profile) => profile.user, { cascade: true })
  technicianProfile: Relation<TechnicianProfile>;

  @CreateDateColumn()
  createdAt: Date;
}