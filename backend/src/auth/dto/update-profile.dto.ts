import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'João Silva', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ example: 'joaosilva_dev', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message:
      'O nome de usuário deve conter apenas letras, números, ponto ou underline',
  })
  username?: string;

  @ApiProperty({
    example: 'Desenvolvedor front-end apaixonado por código.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'A bio deve ter no máximo 280 caracteres' })
  bio?: string;

  @ApiProperty({
    example: 'http://localhost:3000/uploads/avatar.png',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}
