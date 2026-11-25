import { IsInt, IsString, Max, MaxLength, Min, MinLength, Matches } from 'class-validator';
export class WarrantyRequestDto {
  @IsString() @MinLength(10) @MaxLength(500) @Matches(/\S/)
  reason!: string;
}
export class PaidAmountDto {
  @IsInt() @Min(0) @Max(100000000)
  amount!: number;
}
