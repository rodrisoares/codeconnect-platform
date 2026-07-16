import { ApiProperty } from '@nestjs/swagger';

// Resumo público de um usuário (usado em listas de seguidores/seguindo)
export class UserSummaryDto {
  @ApiProperty({ example: 'clxyz123abc', description: 'ID único do usuário' })
  id: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário' })
  name: string;

  @ApiProperty({
    example: 'joaosilva_dev',
    description: 'Username do usuário',
    nullable: true,
  })
  username?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    description: 'URL do avatar do usuário',
    nullable: true,
  })
  avatar?: string;
}

export class PublicProfileDto extends UserSummaryDto {
  @ApiProperty({
    example: 'Desenvolvedor front-end apaixonado por código.',
    description: 'Biografia do usuário',
    nullable: true,
  })
  bio?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Data de criação da conta',
  })
  createdAt: Date;

  @ApiProperty({ example: 12, description: 'Quantidade de seguidores' })
  followersCount: number;

  @ApiProperty({ example: 8, description: 'Quantidade de usuários seguidos' })
  followingCount: number;

  @ApiProperty({ example: 5, description: 'Quantidade de posts publicados' })
  postsCount: number;

  @ApiProperty({
    example: false,
    description: 'Indica se o usuário autenticado segue este perfil',
  })
  isFollowing: boolean;

  @ApiProperty({
    example: false,
    description: 'Indica se este perfil é o do próprio usuário autenticado',
  })
  isMe: boolean;
}

export class FollowResponseDto {
  @ApiProperty({
    example: true,
    description: 'Estado atual da conexão (true = seguindo)',
  })
  isFollowing: boolean;

  @ApiProperty({
    example: 13,
    description: 'Número atualizado de seguidores do usuário alvo',
  })
  followersCount: number;
}
