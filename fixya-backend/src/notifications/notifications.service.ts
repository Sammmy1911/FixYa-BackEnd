import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity.js';
import { NOTIFICATION_PROVIDER, type NotificationProvider } from './notification-provider.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @Inject(NOTIFICATION_PROVIDER) private readonly provider: NotificationProvider,
  ) {}

  /** Envía por el proveedor y deja constancia en la tabla `notifications`. */
  async notify(phone: string | null, message: string, serviceRequestId?: string) {
    await this.provider.send(phone, message);
    return this.repo.save(
      this.repo.create({
        phone,
        message,
        serviceRequest: serviceRequestId ? { id: serviceRequestId } : null,
      }),
    );
  }

  async notifyInApp(recipientId: string, message: string, serviceRequestId: string) {
    return this.repo.save(this.repo.create({ recipientId, phone: null, message, serviceRequest: { id: serviceRequestId } }));
  }

  async mine(recipientId: string) {
    const rows = await this.repo.find({ where: { recipientId }, order: { createdAt: 'DESC' } });
    return rows.map(({ id, message, createdAt, readAt }) => ({ id, message, createdAt, readAt }));
  }

  async markRead(recipientId: string, id: string) {
    const result = await this.repo.update({ id, recipientId }, { readAt: new Date() });
    if (result.affected !== 1) throw new NotFoundException('Notificacion no encontrada');
    return { id, read: true };
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
