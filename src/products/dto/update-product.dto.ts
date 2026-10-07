import {
  Length,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class updateProductTDO {
  @IsString()
  @Length(3, 20)
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ example: 'laptop' })
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MinLength(5)
  @ApiPropertyOptional({ example: 'this is very good laptop' })
  description?: string;

  @IsNumber()
  @Min(5)
  @IsOptional()
  @ApiPropertyOptional({ example: 1500 })
  price?: number;
}
