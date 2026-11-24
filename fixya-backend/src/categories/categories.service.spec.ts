import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { Category } from './entities/category.entity.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const repo = {
    find: vi.fn(),
    findOne: vi.fn(),
    count: vi.fn(),
    create: vi.fn((x) => x),
    save: vi.fn((x) => Promise.resolve(x)),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: repo },
      ],
    }).compile();
    service = module.get(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll devuelve las categorías ordenadas por nombre', async () => {
    repo.find.mockResolvedValue([{ id: 1, name: 'Cerrajería' }]);
    await service.findAll();
    expect(repo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('findOne lanza NotFound si no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  it('create lanza Conflict si el nombre ya existe', async () => {
    repo.findOne.mockResolvedValue({ id: 1, name: 'Pintura' });
    await expect(service.create({ name: 'Pintura' })).rejects.toThrow(ConflictException);
  });

  it('onModuleInit siembra categorías solo si la tabla está vacía', async () => {
    repo.count.mockResolvedValue(0);
    await service.onModuleInit();
    expect(repo.save).toHaveBeenCalledTimes(1);

    repo.save.mockClear();
    repo.count.mockResolvedValue(3);
    await service.onModuleInit();
    expect(repo.save).not.toHaveBeenCalled();
  });
});
