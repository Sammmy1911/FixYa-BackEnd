import { Injectable, Logger } from '@nestjs/common';
import type { NotificationProvider } from './notification-provider.js';

/** Proveedor simulado (demo): no envía nada, solo registra el mensaje en el log. */
@Injectable()
export class MockWhatsappProvider implements NotificationProvider {
  private readonly logger = new Logger('WhatsApp');

  send(phone: string | null, message: string): Promise<void> {
    this.logger.log(`→ ${phone ?? '(sin teléfono)'}: ${message}`);
    return Promise.resolve();
  }
}
