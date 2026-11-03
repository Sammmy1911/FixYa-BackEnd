import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';
import { UserRole } from '../common/enums/roles.enums.js';
import { RegisterTechnicianDto } from './dto/register-technician.dto.js';
import {
  MAX_DOCUMENTS,
  assertValidDocument,
  deleteDocuments,
  saveDocuments,
} from './document-storage.js';

@Injectable()
export class TechniciansService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async register(dto: RegisterTechnicianDto, files: Express.Multer.File[] = []) {
    if (files.length === 0) {
      throw new BadRequestException('Debes subir al menos un documento (cédula, certificados, etc.)');
    }
    if (files.length > MAX_DOCUMENTS) {
      throw new BadRequestException(`Máximo ${MAX_DOCUMENTS} documentos`);
    }
    files.forEach(assertValidDocument);

    const email = dto.email.trim().toLowerCase();
    if (await this.users.findOne({ where: { email } })) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const storedNames = await saveDocuments(files);

    try {
      // Un solo save: User + TechnicianProfile (cascade) en una transacción.
      const user = await this.users.save(
        this.users.create({
          email,
          passwordHash,
          fullName: dto.fullName.trim(),
          role: UserRole.TECHNICIAN,
          technicianProfile: {
            documentsUrl: storedNames,
            isVerified: false,
          } as TechnicianProfile,
        }),
      );

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        technicianProfile: {
          id: user.technicianProfile.id,
          isVerified: user.technicianProfile.isVerified,
          documentsCount: storedNames.length,
        },
        message: 'Registro recibido. Tu cuenta quedará activa para recibir trabajos cuando sea verificada.',
      };
    } catch (error) {
      await deleteDocuments(storedNames); // no dejar archivos huérfanos
      throw error;
    }
  }
}
