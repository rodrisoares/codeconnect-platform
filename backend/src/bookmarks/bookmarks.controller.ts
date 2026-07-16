import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Bookmarks')
@Controller('bookmarks')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar posts salvos pelo usuário logado' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  findAll(@Request() req: RequestWithUser) {
    return this.bookmarksService.findAllForUser(req.user.sub);
  }

  @Post(':postId')
  @ApiOperation({ summary: 'Salvar/remover post dos bookmarks (toggle)' })
  @ApiParam({ name: 'postId', description: 'ID do post', type: 'number' })
  @ApiResponse({
    status: 201,
    description: 'Estado do bookmark alternado (retorna bookmarked)',
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  toggle(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req: RequestWithUser,
  ) {
    return this.bookmarksService.toggle(postId, req.user.sub);
  }
}
