import { IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class updateTDO {
  @IsOptional()
  @Length(5, 150)
  @IsOptional()
  @ApiProperty({ example: 'test-user' })
  public username: string;

  @Length(5, 150)
  @IsOptional()
  @ApiProperty({ example: 'test1234' })
  public password: string;
}
