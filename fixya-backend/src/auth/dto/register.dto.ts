import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

// Definimos el enum para los roles permitidos
export enum UserRole {
  CLIENT = 'CLIENT',
  TECHNICIAN = 'TECHNICIAN',
}

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName: string;

  // Nuevos campos opcionales permitidos por el DTO
  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser CLIENT o TECHNICIAN' })
  role?: UserRole;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto válido' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'La especialidad debe ser un texto válido' })
  specialty?: string;
}