import { IsEmail, Length, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class loginTDO {
  @IsEmail({}, { message: 'Please provide a avalid email.' })
  @MaxLength(250)
  @ApiProperty({ example: 'test@gmail.com' })
  public email: string;

  @Length(5, 150)
  @ApiProperty({ example: 'test1234' })
  public password: string;
}
