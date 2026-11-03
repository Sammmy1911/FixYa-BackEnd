import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity.js';
import { TechnicianProfile } from './technician-profile.entity.js';

export enum UserRole {
  CLIENT = 'CLIENT',
  TECHNICIAN = 'TECHNICIAN',
}

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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  specialty?: string;

  // Ajuste en la relación para evitar error TS2339 si en ServiceRequest se llama 'client' o 'user'
  @OneToMany(() => ServiceRequest, (serviceRequest: any) => serviceRequest.user || serviceRequest.client)
  serviceRequests: ServiceRequest[];

  @OneToOne(() => TechnicianProfile, (profile: any) => profile.user)
  technicianProfile: TechnicianProfile;

  @CreateDateColumn()
  createdAt: Date;
}