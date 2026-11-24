import { Inject, Injectable } from '@nestjs/common';
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

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
