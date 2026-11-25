import { describe, it, expect, vi } from 'vitest';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';

describe('FG-17 historial y garantia', () => {
  const make = (status: ServiceStatus = ServiceStatus.COMPLETED, exists = false, owned = true) => {
    const original = { id: 'original', status, address: 'Cali', category: { id: 1 }, phone: '3001234567', neighborhood: 'Centro', warrantyOfId: null };
    const qb = { where: vi.fn().mockReturnThis(), setLock: vi.fn().mockReturnThis(), getOne: vi.fn().mockResolvedValue(owned ? original : null) };
    const repo = { createQueryBuilder: vi.fn().mockReturnValue(qb), findOneBy: vi.fn().mockResolvedValue(exists ? { id: 'prior' } : null), findOne: vi.fn().mockResolvedValue(original), create: vi.fn(x => x), save: vi.fn(x => Promise.resolve({ ...x, id: 'warranty' })) };
    const requests = { manager: { transaction: vi.fn(fn => fn({ getRepository: () => repo })) } };
    const notifications = { notifyInApp: vi.fn().mockResolvedValue(undefined) };
    const service = new ServiceRequestsService(requests as never, {} as never, {} as never, {} as never, notifications as never);
    return { service, repo, notifications };
  };
  it('crea un nuevo trabajo pendiente vinculado al servicio completado', async () => {
    const { service, repo, notifications } = make();
    await expect(service.requestWarranty('owner', 'original', 'La reparacion volvio a fallar')).resolves.toEqual({ id: 'warranty', status: ServiceStatus.PENDING });
    expect(notifications.notifyInApp).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ warrantyOfId: 'original', client: { id: 'owner' }, status: ServiceStatus.PENDING }));
  });
  it('rechaza reclamo duplicado', async () => { const { service } = make(ServiceStatus.COMPLETED, true); await expect(service.requestWarranty('owner', 'original', 'La reparacion volvio a fallar')).rejects.toBeInstanceOf(ConflictException); });
  it('rechaza servicio no completado', async () => { const { service } = make(ServiceStatus.PENDING); await expect(service.requestWarranty('owner', 'original', 'La reparacion volvio a fallar')).rejects.toBeInstanceOf(ConflictException); });
  it('rechaza servicio ajeno', async () => { const { service } = make(ServiceStatus.COMPLETED, false, false); await expect(service.requestWarranty('other', 'original', 'La reparacion volvio a fallar')).rejects.toBeInstanceOf(NotFoundException); });
  it('rechaza motivo vacio', async () => { const { service } = make(); await expect(service.requestWarranty('owner', 'original', '   ')).rejects.toBeInstanceOf(BadRequestException); });
});
