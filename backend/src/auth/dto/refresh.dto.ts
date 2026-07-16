import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshDto {
  // Opcional: normalmente o refresh token vem do cookie httpOnly.
  // Mantido no corpo por compatibilidade (ex.: testes/Swagger).
  @ApiPropertyOptional({ description: 'Refresh token (opcional; via cookie)' })
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
