import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service.js';
import { ServiceRequest } from './entities/service-request.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';

const request = (over = {}) => ({
  id: 'r1',
  status: ServiceStatus.PENDING,
  client: { id: 'c1', phone: '+57300' },
  technician: { id: 't1', user: { phone: '+57311' } },
  ...over,
});

describe('ServiceRequestsService', () => {
  let service: ServiceRequestsService;
  const repo = { findOne: vi.fn(), save: vi.fn((x) => Promise.resolve(x)) };
  const notifications = { notify: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    repo.findOne.mockResolvedValue(request());
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRequestsService,
        { provide: getRepositoryToken(ServiceRequest), useValue: repo },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = module.get(ServiceRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('cambia el estado y notifica a cliente y técnico', async () => {
    await expect(service.updateStatus('r1', ServiceStatus.ACCEPTED)).resolves.toEqual({
      id: 'r1',
      status: ServiceStatus.ACCEPTED,
    });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: ServiceStatus.ACCEPTED }));
    expect(notifications.notify).toHaveBeenCalledTimes(2);
    expect(notifications.notify).toHaveBeenCalledWith('+57300', expect.stringContaining('aceptado'), 'r1');
    expect(notifications.notify).toHaveBeenCalledWith('+57311', expect.stringContaining('aceptado'), 'r1');
  });

  it('solo notifica al cliente si aún no hay técnico', async () => {
    repo.findOne.mockResolvedValue(request({ technician: null }));
    await service.updateStatus('r1', ServiceStatus.CANCELLED);
    expect(notifications.notify).toHaveBeenCalledTimes(1);
  });

  it('404 si el servicio no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.updateStatus('r1', ServiceStatus.ACCEPTED)).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([
    [ServiceStatus.PENDING, ServiceStatus.COMPLETED],
    [ServiceStatus.PENDING, ServiceStatus.IN_PROGRESS],
    [ServiceStatus.ACCEPTED, ServiceStatus.COMPLETED],
    [ServiceStatus.IN_PROGRESS, ServiceStatus.CANCELLED],
    [ServiceStatus.COMPLETED, ServiceStatus.PENDING],
    [ServiceStatus.CANCELLED, ServiceStatus.ACCEPTED],
  ])('400 y sin notificar si se intenta %s → %s', async (from, to) => {
    repo.findOne.mockResolvedValue(request({ status: from }));
    await expect(service.updateStatus('r1', to)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it.each([
    [ServiceStatus.PENDING, ServiceStatus.ACCEPTED],
    [ServiceStatus.ACCEPTED, ServiceStatus.IN_PROGRESS],
    [ServiceStatus.IN_PROGRESS, ServiceStatus.COMPLETED],
    [ServiceStatus.ACCEPTED, ServiceStatus.CANCELLED],
  ])('permite %s → %s', async (from, to) => {
    repo.findOne.mockResolvedValue(request({ status: from }));
    await expect(service.updateStatus('r1', to)).resolves.toMatchObject({ status: to });
  });
});
