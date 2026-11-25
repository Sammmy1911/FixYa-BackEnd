import { vi } from 'vitest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const profile = { user: { id: 'tech', fullName: 'Técnico', email: 'tech@example.test', password: 'secret' }, isVerified: false, documentsUrl: ['private.pdf'] };
  const repo = { find: vi.fn(), findOne: vi.fn(), save: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: { manager: { getRepository: () => repo } } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('lista técnicos sin exponer contraseñas ni rutas privadas', async () => {
    repo.find.mockResolvedValue([profile]);
    const [result] = await service.listTechnicians();
    expect(result).toEqual({ id: 'tech', fullName: 'Técnico', email: 'tech@example.test', specialty: null, isVerified: false, documentCount: 1 });
  });
  it('aprueba y suspende un perfil existente', async () => {
    const current = { ...profile };
    repo.findOne.mockResolvedValue(current);
    await expect(service.setTechnicianVerified('tech', true)).resolves.toEqual({ technicianId: 'tech', isVerified: true });
    await expect(service.setTechnicianVerified('tech', false)).resolves.toEqual({ technicianId: 'tech', isVerified: false });
    expect(repo.save).toHaveBeenCalledTimes(2);
  });
  it('rechaza un perfil inexistente', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.setTechnicianVerified('missing', true)).rejects.toThrow('Perfil técnico no encontrado');
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
