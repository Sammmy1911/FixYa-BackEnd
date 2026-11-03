import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity.js';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => ServiceRequest, (request: ServiceRequest) => request.category)
  serviceRequests: ServiceRequest[];
}