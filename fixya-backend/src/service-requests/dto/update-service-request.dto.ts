import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceRequestDto } from './create-service-request.dto.js';

export class UpdateServiceRequestDto extends PartialType(CreateServiceRequestDto) {}
