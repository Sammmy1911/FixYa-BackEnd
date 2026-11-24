import { PartialType } from '@nestjs/mapped-types';
import { RegisterDto } from '../../auth/dto/register.dto.js';

export class CreateUserDto extends PartialType(RegisterDto) {}