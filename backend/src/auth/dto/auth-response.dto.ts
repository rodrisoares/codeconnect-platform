import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: 'clxyz123abc',
    description: 'ID único do usuário',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email do usuário',
  })
  email: string;

  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  name: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Data de criação do usuário',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Data da última atualização do usuário',
  })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT de acesso (curta duração)',
  })
  access_token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT de refresh (longa duração)',
  })
  refresh_token: string;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Dados do usuário autenticado',
  })
  user: UserResponseDto;
}

export class RefreshResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Novo token JWT de acesso',
  })
  access_token: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    example: 'Logout realizado com sucesso',
    description: 'Mensagem de confirmação do logout',
  })
  message: string;
}
