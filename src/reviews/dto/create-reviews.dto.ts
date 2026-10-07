import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class createReviewDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'I like it' })
  review: string;
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  @ApiProperty({ example: 4.5 })
  rating: number;
}
