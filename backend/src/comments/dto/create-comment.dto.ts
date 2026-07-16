import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Ótimo post! Muito esclarecedor.',
    description: 'Texto do comentário',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    example: 12,
    description:
      'ID do comentário pai, quando este é uma resposta (thread de 1 nível)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}
