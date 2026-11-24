import { IsEnum } from 'class-validator';
import { ServiceStatus } from '../../common/enums/service-status.enum.js';

export class UpdateStatusDto {
  @IsEnum(ServiceStatus)
  status: ServiceStatus;
}
