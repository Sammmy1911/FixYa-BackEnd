import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service.js';
import { Notification } from './entities/notification.entity.js';
import { NOTIFICATION_PROVIDER } from './notification-provider.js';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const provider = { send: vi.fn().mockResolvedValue(undefined) };
  const repo = {
    create: vi.fn((x) => x),
    save: vi.fn((x) => Promise.resolve({ id: 'n1', ...x })),
    find: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: repo },
        { provide: NOTIFICATION_PROVIDER, useValue: provider },
      ],
    }).compile();
    service = module.get(NotificationsService);
  });

  it('envía por el proveedor y guarda la notificación', async () => {
    const result = await service.notify('+573001112233', 'hola', 'r1');
    expect(provider.send).toHaveBeenCalledWith('+573001112233', 'hola');
    expect(result).toMatchObject({ phone: '+573001112233', message: 'hola', serviceRequest: { id: 'r1' } });
  });

  it('acepta teléfono nulo y servicio omitido', async () => {
    await service.notify(null, 'hola');
    expect(repo.save).toHaveBeenCalledWith({ phone: null, message: 'hola', serviceRequest: null });
  });

  it('lista las notificaciones, más recientes primero', async () => {
    repo.find.mockResolvedValue([{ id: 'n1' }]);
    await expect(service.findAll()).resolves.toEqual([{ id: 'n1' }]);
    expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
  });
});
