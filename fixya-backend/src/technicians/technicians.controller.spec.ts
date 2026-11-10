import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TechniciansController } from './technicians.controller.js';
import { TechniciansService } from './technicians.service.js';
import { User } from '../users/entities/user.entity.js';

const fields = { email: 'tec@mail.com', password: 'clave1234', fullName: 'Juan Pérez' };
const pdfBuffer = (extra = 100) => Buffer.concat([Buffer.from('%PDF-1.4'), Buffer.alloc(extra)]);

describe('POST /technicians/register (multipart)', () => {
  let app: INestApplication;
  let dir: string;
  const repo = {
    findOne: vi.fn(),
    create: vi.fn((x) => x),
    save: vi.fn((u) =>
      Promise.resolve({ ...u, id: 'u1', technicianProfile: { ...u.technicianProfile, id: 'p1' } }),
    ),
  };

  const send = (docs: { buf: Buffer; name: string; type: string }[]) => {
    const req = request(app.getHttpServer())
      .post('/technicians/register')
      .field('email', fields.email)
      .field('password', fields.password)
      .field('fullName', fields.fullName);
    docs.forEach((d) =>
      req.attach('documents', d.buf, { filename: d.name, contentType: d.type }),
    );
    return req;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    repo.findOne.mockResolvedValue(null);
    dir = await mkdtemp(join(tmpdir(), 'fixya-http-'));
    process.env.UPLOADS_DIR = dir;
    const module = await Test.createTestingModule({
      controllers: [TechniciansController],
      providers: [TechniciansService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  });

  it('201: registra técnico con un PDF y lo guarda en disco', async () => {
    const res = await send([{ buf: pdfBuffer(), name: 'cedula.pdf', type: 'application/pdf' }]);

    expect(res.status).toBe(201);
    expect(res.body.technicianProfile).toMatchObject({ isVerified: false, documentsCount: 1 });
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(await readdir(dir)).toHaveLength(1);
  });

  it('400: sin documentos', async () => {
    const res = await send([]);
    expect(res.status).toBe(400);
  });

  it('400: tipo no permitido', async () => {
    const res = await send([{ buf: Buffer.from('hola'), name: 'a.txt', type: 'text/plain' }]);
    expect(res.status).toBe(400);
    expect(await readdir(dir)).toHaveLength(0);
  });

  it('400: PDF falso (mimetype pdf pero bytes distintos)', async () => {
    const res = await send([{ buf: Buffer.from('no soy pdf'), name: 'x.pdf', type: 'application/pdf' }]);
    expect(res.status).toBe(400);
    expect(await readdir(dir)).toHaveLength(0);
  });

  it('413: archivo mayor a 5 MB', async () => {
    const res = await send([
      { buf: pdfBuffer(5 * 1024 * 1024), name: 'grande.pdf', type: 'application/pdf' },
    ]);
    expect(res.status).toBe(413);
    expect(await readdir(dir)).toHaveLength(0);
  });

  it('400: más de 5 documentos', async () => {
    const docs = Array.from({ length: 6 }, (_, i) => ({
      buf: pdfBuffer(),
      name: `d${i}.pdf`,
      type: 'application/pdf',
    }));
    const res = await send(docs);
    expect(res.status).toBe(400);
    expect(await readdir(dir)).toHaveLength(0);
  });
});
