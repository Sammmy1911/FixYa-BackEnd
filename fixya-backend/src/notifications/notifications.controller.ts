import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // Demo: lista los mensajes "enviados" por WhatsApp (simulado).
  @Get()
  findAll() {
    return this.notifications.findAll();
  }
}
