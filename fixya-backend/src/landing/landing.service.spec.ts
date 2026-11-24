import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LandingService } from './landing.service.js';
import { Category } from '../categories/entities/category.entity.js';
import { TechnicianProfile } from '../users/entities/technician-profile.entity.js';
import { ServiceRequest } from '../service-requests/entities/service-request.entity.js';

describe('LandingService', () => {
  it('devuelve servicios, cómo funciona y señales de confianza', async () => {
    const module = await Test.createTestingModule({
      providers: [
        LandingService,
        {
          provide: getRepositoryToken(Category),
          useValue: { find: vi.fn().mockResolvedValue([{ id: 1, name: 'Plomería', description: 'x', serviceRequests: [] }]) },
        },
        { provide: getRepositoryToken(TechnicianProfile), useValue: { count: vi.fn().mockResolvedValue(7) } },
        { provide: getRepositoryToken(ServiceRequest), useValue: { count: vi.fn().mockResolvedValue(42) } },
      ],
    }).compile();

    const result = await module.get(LandingService).getLanding();

    expect(result.services).toEqual([{ id: 1, name: 'Plomería', description: 'x' }]);
    expect(result.howItWorks.length).toBeGreaterThan(0);
    expect(result.trust).toEqual({ verifiedTechnicians: 7, completedServices: 42 });
  });
});
