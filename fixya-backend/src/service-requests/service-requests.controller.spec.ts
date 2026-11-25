import { describe, it, expect, vi } from 'vitest';
import { ServiceRequestsController } from './service-requests.controller.js';

describe('ServiceRequestsController - FG-15', () => {
  it('obtiene usuario desde JWT y no desde parámetros arbitrarios', async () => {
    const service = { available: vi.fn().mockResolvedValue([]) };
    const controller = new ServiceRequestsController(service as any);
    await controller.available({ user: { userId: 'authorized-user', role: 'technician' } } as any);
    expect(service.available).toHaveBeenCalledWith('authorized-user');
  });
});
