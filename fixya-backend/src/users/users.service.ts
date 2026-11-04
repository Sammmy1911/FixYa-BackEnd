import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { TechnicianProfile } from './entities/technician-profile.entity.js';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { UserRole } from '../common/enums/roles.enums.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TechnicianProfile) private readonly profileRepository: Repository<TechnicianProfile>,
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const newUser = this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      fullName: registerDto.fullName,
      role: registerDto.role || UserRole.CLIENT,
    });

    // La transacción crea ambas entidades o ninguna. El usuario no nace verificado.
    return this.userRepository.manager.transaction(async (manager) => {
      const user = await manager.save(User, newUser);
      if (user.role === UserRole.TECHNICIAN) {
        await manager.save(TechnicianProfile, manager.create(TechnicianProfile, { user, isVerified: false }));
      }
      return user;
    });
  }

  async setTechnicianVerified(userId: string, isVerified: boolean) {
    const profile = await this.profileRepository.findOne({ where: { user: { id: userId } } });
    if (!profile) throw new NotFoundException('Perfil técnico no encontrado');
    profile.isVerified = isVerified;
    await this.profileRepository.save(profile);
    return { technicianId: userId, isVerified: profile.isVerified };
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async update(id: string, updateData: any): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}