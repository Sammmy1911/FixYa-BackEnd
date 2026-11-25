import { describe, it, expect, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service.js';
import { ServiceStatus } from '../common/enums/service-status.enum.js';

describe('FG-15 — reglas de solicitudes', () => {
  const make = (options: { affected?: number; verified?: boolean; status?: ServiceStatus } = {}) => {
    const execute = vi.fn().mockResolvedValue({ affected: options.affected ?? 1 });
    const builder: any = { update: vi.fn(), set: vi.fn(), where: vi.fn(), andWhere: vi.fn(), execute };
    for (const method of ['update', 'set', 'where', 'andWhere']) builder[method].mockReturnValue(builder);
    const findOne = vi.fn().mockResolvedValue({ id: 'req', status: options.status ?? ServiceStatus.PENDING, technician: null, client: { phone: null } });
    const repo: any = { createQueryBuilder: vi.fn().mockReturnValue(builder), findOne, find: vi.fn().mockResolvedValue([]), create: vi.fn(x=>x), save: vi.fn(x=>Promise.resolve(x)) };
    const rejectionRepo: any = { createQueryBuilder: vi.fn().mockReturnValue({ insert: () => ({ values: () => ({ orIgnore: () => ({ execute: vi.fn().mockResolvedValue({}) }) }) }) }) };
    const profiles: any = { update: vi.fn().mockResolvedValue({ affected: 1 }), findOne: vi.fn().mockResolvedValue({ id:'tech-profile', isVerified: options.verified ?? true }) };
    const categories: any = { findOneBy: vi.fn().mockResolvedValue({id:1,name:'Plomería'}) };
    const service = new ServiceRequestsService(repo, rejectionRepo, profiles, categories, { notify: vi.fn() } as any);
    return { service, execute, repo, profiles, categories };
  };
  it('acepta con actualización condicional, y verifica el resultado', async () => {
    const {service, execute} = make();
    await expect(service.accept('req','tech-user')).resolves.toHaveProperty('id','req');
    expect(execute).toHaveBeenCalledOnce();
  });
  it('bloquea que dos técnicos acepten una solicitud ya tomada', async () => {
    const {service} = make({affected:0});
    await expect(service.accept('req','tech-user')).rejects.toBeInstanceOf(ConflictException);
  });
  it('rechaza perfiles técnicos sin verificar', async () => {
    const {service} = make({verified:false});
    await expect(service.mine('tech-user')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('crea solicitud pendiente a nombre del cliente y con categoría válida', async () => {
    const {service} = make();
    await expect(service.createForClient('client-user',{description:'Fuga en el lavamanos',address:'Cali, calle 10',categoryId:1}))
      .resolves.toMatchObject({status: ServiceStatus.PENDING,client:{id:'client-user'}});
  });
  it('exige zonas y categorías para activar recomendaciones', async () => {
    const { service } = make();
    await expect(service.setAvailability('tech-user', { autoAvailable: true, coverageZones: [], coverageCategories: [] })).rejects.toThrow('Selecciona');
  });
  it('guarda preferencias sin duplicados', async () => {
    const { service, profiles } = make();
    await expect(service.setAvailability('tech-user', { autoAvailable: true, coverageZones: [' Granada ', 'granada'], coverageCategories: [1,1] })).resolves.toEqual({ autoAvailable: true, coverageZones: ['granada'], coverageCategories: [1] });
    expect(profiles.update).toHaveBeenCalledOnce();
  });
  it('no permite configurar un perfil sin verificar', async () => {
    const { service } = make({verified:false});
    await expect(service.getAvailability('tech-user')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('muestra recomendación sin cambiar el estado pendiente', async () => {
    const { service, repo } = make();
    repo.find.mockResolvedValue([{ id: 'req', status: ServiceStatus.PENDING }]);
    repo.query = vi.fn().mockResolvedValue([{request_id:'req', technician_id:'tech-profile'}]);
    await expect(service.listForClient('client-user')).resolves.toMatchObject([{id:'req', status:ServiceStatus.PENDING, hasRecommendation:true}]);
  });
  it('impide publicar en una categoría inexistente', async () => {
    const {service,categories} = make(); categories.findOneBy.mockResolvedValue(null);
    await expect(service.createForClient('client-user',{description:'Fuga en el lavamanos',address:'Cali, calle 10',categoryId:999}))
      .rejects.toBeInstanceOf(NotFoundException);
  });
  it('solo permite avanzar accepted -> in_progress', async () => {
    const {service, execute} = make();
    await expect(service.updateProgress('req','tech-user',ServiceStatus.IN_PROGRESS)).resolves.toEqual({id:'req',status:ServiceStatus.IN_PROGRESS});
    expect(execute).toHaveBeenCalledOnce();
  });
  it('impide alterar el estado si no se cumple la condición de propiedad o transición', async () => {
    const {service} = make({affected:0});
    await expect(service.updateProgress('req','tech-user',ServiceStatus.COMPLETED)).rejects.toBeInstanceOf(ConflictException);
  });
});
