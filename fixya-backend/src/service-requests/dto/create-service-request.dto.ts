import { IsInt, IsNotEmpty, IsString, MaxLength, Min, MinLength } from 'class-validator';
export class CreateServiceRequestDto {
  @IsString() @IsNotEmpty() @MinLength(10) @MaxLength(2000) description!: string;
  @IsString() @IsNotEmpty() @MaxLength(300) address!: string;
  @IsInt() @Min(1) categoryId!: number;
}
