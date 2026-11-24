/** Proveedor de envío de WhatsApp. Cambiar de proveedor = otra implementación de esta interfaz. */
export interface NotificationProvider {
  send(phone: string | null, message: string): Promise<void>;
}

export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');
