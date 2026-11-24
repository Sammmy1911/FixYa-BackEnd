import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterTechnicianDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72) // límite real de bcrypt
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;
}
