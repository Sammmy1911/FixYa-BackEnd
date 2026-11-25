import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsString, MaxLength, Min } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsBoolean()
  autoAvailable: boolean;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  coverageZones: string[];

  @IsArray()
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  @Min(1, { each: true })
  coverageCategories: number[];
}
