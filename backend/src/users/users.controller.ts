import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  PublicProfileDto,
  UserSummaryDto,
  FollowResponseDto,
} from './dto/user-response.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Descobrir/buscar pessoas (busca por nome ou sugestões)',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    type: [UserSummaryDto],
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  discover(
    @Query('search') search: string,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.discover(req.user.sub, search);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Perfil público de um usuário (com contadores de conexões)',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Perfil retornado com sucesso',
    type: PublicProfileDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  getProfile(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.usersService.getPublicProfile(id, req.user.sub);
  }

  @Get(':id/activity')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atividade diária (posts + comentários) dos últimos 12 meses',
  })
  @ApiParam({ name: 'id', description: 'ID ou username do usuário', type: 'string' })
  @ApiResponse({ status: 200, description: 'Atividade retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  getActivity(@Param('id') id: string) {
    return this.usersService.getActivity(id);
  }

  @Get(':id/followers')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista de seguidores de um usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Lista retornada com sucesso',
    type: [UserSummaryDto],
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  getFollowers(@Param('id') id: string) {
    return this.usersService.getFollowers(id);
  }

  @Get(':id/following')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista de quem o usuário segue' })
  @ApiParam({ name: 'id', description: 'ID do usuário', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Lista retornada com sucesso',
    type: [UserSummaryDto],
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  getFollowing(@Param('id') id: string) {
    return this.usersService.getFollowing(id);
  }

  @Post(':id/follow')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seguir um usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário a seguir', type: 'string' })
  @ApiResponse({
    status: 201,
    description: 'Passou a seguir o usuário',
    type: FollowResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Não é possível seguir a si mesmo' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  follow(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.usersService.follow(req.user.sub, id);
  }

  @Delete(':id/follow')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deixar de seguir um usuário' })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário a deixar de seguir',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Deixou de seguir o usuário',
    type: FollowResponseDto,
  })
  unfollow(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.usersService.unfollow(req.user.sub, id);
  }
}
