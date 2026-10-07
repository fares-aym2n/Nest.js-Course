import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class updateReviewDTO {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'I like it' })
  review?: string;

  @IsNotEmpty()
  @Min(1)
  @Max(5)
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ example: 4.5 })
  rating?: number;
}
