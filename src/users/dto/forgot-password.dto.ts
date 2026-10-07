import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class forgotPasswordDTO {
  @ApiProperty({
    type: 'string',
    description: 'user email',
    required: true,
    example: 'test@gmail.com',
  })
  @IsEmail({}, { message: 'Please provide a avalid email.' })
  @MaxLength(250)
  @IsNotEmpty()
  public email: string;
}
