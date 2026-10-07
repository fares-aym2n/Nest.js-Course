import {
  Length,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class createProductDTO {
  @IsString()
  @Length(3, 50)
  @IsNotEmpty()
  @ApiProperty({ example: 'Laptop' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @ApiProperty({ example: 'this is good laptop' })
  description: string;

  @IsNumber()
  @Min(5)
  @ApiProperty({ example: 1500 })
  price: number;
}
