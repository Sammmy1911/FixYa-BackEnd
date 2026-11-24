import { ServiceStatus } from '../common/enums/service-status.enum.js';

/** Transiciones permitidas: pending → accepted → in_progress → completed; cancelable antes de empezar. */
export const ALLOWED_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  [ServiceStatus.PENDING]: [ServiceStatus.ACCEPTED, ServiceStatus.CANCELLED],
  [ServiceStatus.ACCEPTED]: [ServiceStatus.IN_PROGRESS, ServiceStatus.CANCELLED],
  [ServiceStatus.IN_PROGRESS]: [ServiceStatus.COMPLETED],
  [ServiceStatus.COMPLETED]: [],
  [ServiceStatus.CANCELLED]: [],
};

export const STATUS_LABEL: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'pendiente',
  [ServiceStatus.ACCEPTED]: 'aceptado',
  [ServiceStatus.IN_PROGRESS]: 'en progreso',
  [ServiceStatus.COMPLETED]: 'completado',
  [ServiceStatus.CANCELLED]: 'cancelado',
};
