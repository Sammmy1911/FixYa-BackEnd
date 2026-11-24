import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceRequestDto {
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}