import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service.js';
import { Category } from './entities/category.entity.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const repository = { create: vi.fn(), save: vi.fn(), find: vi.fn(), findOneBy: vi.fn(), merge: vi.fn(), remove: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService, { provide: getRepositoryToken(Category), useValue: repository }],
    }).compile();
    service = module.get(CategoriesService);
  });

  it('should be defined', () => expect(service).toBeDefined());
});
