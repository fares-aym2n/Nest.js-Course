import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class registerTDO {
  @IsOptional()
  @Length(5, 150)
  @IsNotEmpty()
  @ApiProperty({ example: 'test-user' })
  public username: string;

  @IsEmail({}, { message: 'Please provide a avalid email.' })
  @MaxLength(250)
  @ApiProperty({ example: 'test@gmail.com' })
  public email: string;

  @Length(5, 150)
  @ApiProperty({ example: 'test1234' })
  public password: string;
}
