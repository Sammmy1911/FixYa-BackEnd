import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';
import { TechnicianProfile } from './entities/technician-profile.entity.js';

describe('UsersService', () => {
  let service: UsersService;
  const users = { findOne: vi.fn(), find: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), manager: { transaction: vi.fn() } };
  const profiles = { findOne: vi.fn(), save: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(TechnicianProfile), useValue: profiles },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('should be defined', () => expect(service).toBeDefined());
});
