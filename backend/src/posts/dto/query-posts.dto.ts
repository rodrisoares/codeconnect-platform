import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPostsDto {
  @ApiPropertyOptional({ description: 'Página (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filtrar por tag' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Busca por título ou descrição' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Escopo do feed: todos ou apenas de quem o usuário segue',
    enum: ['all', 'following'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'following'])
  filter?: 'all' | 'following';

  @ApiPropertyOptional({
    description: 'Ordenação: mais recentes ou mais populares',
    enum: ['recent', 'popular'],
    default: 'recent',
  })
  @IsOptional()
  @IsIn(['recent', 'popular'])
  sort?: 'recent' | 'popular';
}
