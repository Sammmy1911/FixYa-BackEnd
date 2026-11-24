import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { MockWhatsappProvider } from './mock-whatsapp.provider.js';
import { NOTIFICATION_PROVIDER } from './notification-provider.js';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    // Para usar Twilio u otro: reemplazar useClass por otra implementación de NotificationProvider.
    { provide: NOTIFICATION_PROVIDER, useClass: MockWhatsappProvider },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
