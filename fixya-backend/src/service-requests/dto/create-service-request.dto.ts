import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
export class CreateServiceRequestDto {
  @IsString() @IsNotEmpty() @MinLength(10) @MaxLength(2000) description!: string;
  @IsString() @IsNotEmpty() @MaxLength(300) address!: string;
  @IsInt() @Min(1) categoryId!: number;
  @IsOptional() @IsString() @MaxLength(160) neighborhood?: string;
  @IsOptional() @IsString() @Matches(/^3\d{9}$/) phone?: string;
  @IsOptional() @IsIn(['asap', 'later', 'scheduled']) urgency?: 'asap' | 'later' | 'scheduled';
}
