import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TechniciansService } from './technicians.service.js';
import { User } from '../users/entities/user.entity.js';
import { UserRole } from '../common/enums/roles.enums.js';

const dto = { email: 'Tec@Mail.com', password: 'clave1234', fullName: 'Juan Pérez' };
const pdf = (size = 100): Express.Multer.File =>
  ({
    originalname: 'cedula.pdf',
    mimetype: 'application/pdf',
    size,
    buffer: Buffer.concat([Buffer.from('%PDF-1.4'), Buffer.alloc(size)]),
  }) as Express.Multer.File;

describe('TechniciansService', () => {
  let service: TechniciansService;
  let dir: string;
  const repo = {
    findOne: vi.fn(),
    create: vi.fn((x) => x),
    save: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    dir = await mkdtemp(join(tmpdir(), 'fixya-'));
    process.env.UPLOADS_DIR = dir;
    repo.findOne.mockResolvedValue(null);
    repo.save.mockImplementation((u) =>
      Promise.resolve({ ...u, id: 'u1', technicianProfile: { ...u.technicianProfile, id: 'p1' } }),
    );
    const module = await Test.createTestingModule({
      providers: [TechniciansService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();
    service = module.get(TechniciansService);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('registra técnico no verificado, con rol technician y contraseña hasheada', async () => {
    const result = await service.register(dto, [pdf()]);

    const saved = repo.save.mock.calls[0][0];
    expect(saved.role).toBe(UserRole.TECHNICIAN);
    expect(saved.email).toBe('tec@mail.com');
    expect(saved.password).not.toBe(dto.password);
    expect(saved.technicianProfile.isVerified).toBe(false);
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.technicianProfile.documentsCount).toBe(1);
    expect(await readdir(dir)).toHaveLength(1);
  });

  it('exige al menos un documento', async () => {
    await expect(service.register(dto, [])).rejects.toThrow(BadRequestException);
  });

  it('rechaza archivos cuyo contenido no coincide con el tipo declarado', async () => {
    const fake = { ...pdf(), buffer: Buffer.from('<script>alert(1)</script>') } as Express.Multer.File;
    await expect(service.register(dto, [fake])).rejects.toThrow(BadRequestException);
  });

  it('rechaza tipos no permitidos', async () => {
    const exe = { ...pdf(), mimetype: 'application/x-msdownload' } as Express.Multer.File;
    await expect(service.register(dto, [exe])).rejects.toThrow(BadRequestException);
  });

  it('rechaza correo duplicado sin guardar archivos', async () => {
    repo.findOne.mockResolvedValue({ id: 'x' });
    await expect(service.register(dto, [pdf()])).rejects.toThrow(ConflictException);
    expect(await readdir(dir)).toHaveLength(0);
  });

  it('borra los archivos si falla el guardado en BD', async () => {
    repo.save.mockRejectedValue(new Error('db down'));
    await expect(service.register(dto, [pdf()])).rejects.toThrow('db down');
    expect(await readdir(dir)).toHaveLength(0);
  });
});
