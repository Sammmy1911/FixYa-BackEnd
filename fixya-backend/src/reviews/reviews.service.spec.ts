import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { Review } from './entities/review.entity.js';
import { ServiceRequest } from '../service-requests/entities/service-request.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';

const completed = (over = {}) => ({
  id: 'r1',
  status: ServiceStatus.COMPLETED,
  client: { id: 'c1' },
  technician: { id: 't1' },
  ...over,
});

describe('ReviewsService', () => {
  let service: ReviewsService;
  const getRawOne = vi.fn();
  const reviews = {
    existsBy: vi.fn(),
    create: vi.fn((x) => x),
    save: vi.fn((x) => Promise.resolve({ id: 'rv1', ...x })),
    find: vi.fn(),
    createQueryBuilder: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawOne,
    })),
  };
  const requests = { findOne: vi.fn() };
  const profiles = { update: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    requests.findOne.mockResolvedValue(completed());
    reviews.existsBy.mockResolvedValue(false);
    getRawOne.mockResolvedValue({ avg: '4.5' });
    const module = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: reviews },
        { provide: getRepositoryToken(ServiceRequest), useValue: requests },
        { provide: getRepositoryToken(TechnicianProfile), useValue: profiles },
      ],
    }).compile();
    service = module.get(ReviewsService);
  });

  it('crea la reseña y actualiza el promedio del técnico', async () => {
    const result = await service.create('c1', 'r1', { rating: 5, comment: 'Excelente' });
    expect(result).toMatchObject({ rating: 5, comment: 'Excelente' });
    expect(reviews.save).toHaveBeenCalled();
    expect(profiles.update).toHaveBeenCalledWith('t1', { ratingAverage: 4.5 });
  });

  it('redondea el promedio a 2 decimales', async () => {
    getRawOne.mockResolvedValue({ avg: '4.33333333' });
    await service.create('c1', 'r1', { rating: 4 });
    expect(profiles.update).toHaveBeenCalledWith('t1', { ratingAverage: 4.33 });
  });

  it('404 si el servicio no existe', async () => {
    requests.findOne.mockResolvedValue(null);
    await expect(service.create('c1', 'r1', { rating: 5 })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('403 si quien reseña no es el cliente del servicio', async () => {
    await expect(service.create('otro', 'r1', { rating: 5 })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([ServiceStatus.PENDING, ServiceStatus.ACCEPTED, ServiceStatus.IN_PROGRESS, ServiceStatus.CANCELLED])(
    '400 si el servicio está %s',
    async (status) => {
      requests.findOne.mockResolvedValue(completed({ status }));
      await expect(service.create('c1', 'r1', { rating: 5 })).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('400 si no hay técnico asignado', async () => {
    requests.findOne.mockResolvedValue(completed({ technician: null }));
    await expect(service.create('c1', 'r1', { rating: 5 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('409 si el servicio ya fue reseñado', async () => {
    reviews.existsBy.mockResolvedValue(true);
    await expect(service.create('c1', 'r1', { rating: 5 })).rejects.toBeInstanceOf(ConflictException);
    expect(reviews.save).not.toHaveBeenCalled();
  });

  it('lista las reseñas de un técnico, más recientes primero', async () => {
    reviews.find.mockResolvedValue([{ id: 'rv1' }]);
    await expect(service.findByTechnician('t1')).resolves.toEqual([{ id: 'rv1' }]);
    expect(reviews.find).toHaveBeenCalledWith({
      where: { technician: { id: 't1' } },
      order: { createdAt: 'DESC' },
    });
  });
});
