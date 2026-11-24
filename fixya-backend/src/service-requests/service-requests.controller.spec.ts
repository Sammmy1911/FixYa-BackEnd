import { Test, TestingModule } from '@nestjs/testing';
import { ServiceRequestsController } from './service-requests.controller.js';
import { ServiceRequestsService } from './service-requests.service.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';

describe('ServiceRequestsController', () => {
  let controller: ServiceRequestsController;
  const service = { updateStatus: vi.fn().mockResolvedValue({ id: 'r1', status: ServiceStatus.ACCEPTED }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceRequestsController],
      providers: [{ provide: ServiceRequestsService, useValue: service }],
    }).compile();

    controller = module.get<ServiceRequestsController>(ServiceRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delega el cambio de estado al servicio', async () => {
    await expect(controller.updateStatus('r1', { status: ServiceStatus.ACCEPTED })).resolves.toEqual({
      id: 'r1',
      status: ServiceStatus.ACCEPTED,
    });
    expect(service.updateStatus).toHaveBeenCalledWith('r1', ServiceStatus.ACCEPTED);
  });
});
