import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { UserRole } from '../common/enums/roles.enums.js';
import { TechnicianProfile } from './entities/technician-profile.entity.js';
import { RegisterDto } from '../auth/dto/register.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const { fullName, email, password, role, phone, specialty } = registerDto;

    if (await this.findByEmail(email)) throw new ConflictException('Correo ya registrado');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      fullName,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role || UserRole.CLIENT,
      phone: phone ?? null,
      specialty,
    });

    return this.userRepository.manager.transaction(async manager => {
      const user = await manager.save(User, newUser);
      if (user.role === UserRole.TECHNICIAN) await manager.save(TechnicianProfile, manager.create(TechnicianProfile, { user, isVerified: false }));
      return user;
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  async listTechnicians() {
    const profiles = await this.userRepository.manager.getRepository(TechnicianProfile).find({
      relations: { user: true },
      where: { user: { role: UserRole.TECHNICIAN } },
      order: { createdAt: 'DESC' },
    });
    return profiles.map(profile => ({
      id: profile.user.id,
      fullName: profile.user.fullName,
      email: profile.user.email,
      specialty: profile.user.specialty ?? null,
      isVerified: profile.isVerified,
      documentCount: profile.documentsUrl?.length ?? 0,
    }));
  }

  async setTechnicianVerified(userId: string, isVerified: boolean) {
    const repo = this.userRepository.manager.getRepository(TechnicianProfile);
    const profile = await repo.findOne({ where: { user: { id: userId, role: UserRole.TECHNICIAN } } });
    if (!profile) throw new NotFoundException('Perfil técnico no encontrado');
    profile.isVerified = isVerified;
    await repo.save(profile);
    return { technicianId: userId, isVerified };
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.findOne(id);
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}