import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
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
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  PostResponseDto,
  PostListItemDto,
  PaginatedPostsResponseDto,
  ToggleLikeResponseDto,
} from './dto/post-response.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Blog Posts')
@Controller('blog-posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo post' })
  @ApiResponse({
    status: 201,
    description: 'Post criado com sucesso',
    type: PostListItemDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou slug/autor já existente',
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  create(
    @Body() createPostDto: CreatePostDto,
    @Request() req: RequestWithUser,
  ) {
    return this.postsService.create(createPostDto, req.user.sub);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar posts publicados (paginado, com filtros)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tag', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'filter', required: false, enum: ['all', 'following'] })
  @ApiQuery({ name: 'sort', required: false, enum: ['recent', 'popular'] })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de posts retornada com sucesso',
    type: PaginatedPostsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  findAll(@Query() query: QueryPostsDto, @Request() req: RequestWithUser) {
    return this.postsService.findAll(query, req.user.sub);
  }

  @Get('tags')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar tags existentes com contagem de uso' })
  @ApiResponse({ status: 200, description: 'Tags retornadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  getTags() {
    return this.postsService.getTags();
  }

  @Get('liked')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar posts curtidos pelo usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de posts curtidos retornada com sucesso',
    type: [PostListItemDto],
  })
  findLiked(@Request() req: RequestWithUser) {
    return this.postsService.findLikedByUser(req.user.sub);
  }

  @Get('author/:authorId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar posts de um autor' })
  @ApiParam({ name: 'authorId', description: 'ID do autor', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Lista de posts do autor retornada com sucesso',
    type: [PostListItemDto],
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  findByAuthor(
    @Param('authorId') authorId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.postsService.findByAuthor(authorId, req.user.sub);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar post por ID' })
  @ApiParam({ name: 'id', description: 'ID do post', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Post encontrado com sucesso',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.postsService.findOne(id, req.user.sub);
  }

  @Get('slug/:slug')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar post por slug' })
  @ApiParam({ name: 'slug', description: 'Slug do post', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Post encontrado com sucesso',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  findBySlug(
    @Param('slug') slug: string,
    @Request() req: RequestWithUser,
  ) {
    return this.postsService.findBySlug(slug, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar post (apenas o autor)' })
  @ApiParam({ name: 'id', description: 'ID do post', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Post atualizado com sucesso',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 403, description: 'Você não é o autor do post' })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: RequestWithUser,
  ) {
    return this.postsService.update(id, updatePostDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar post (apenas o autor)' })
  @ApiParam({ name: 'id', description: 'ID do post', type: 'number' })
  @ApiResponse({ status: 200, description: 'Post deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 403, description: 'Você não é o autor do post' })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.postsService.remove(id, req.user.sub);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Curtir/descurtir post (toggle)' })
  @ApiParam({ name: 'id', description: 'ID do post', type: 'number' })
  @ApiResponse({
    status: 201,
    description: 'Estado de curtida alternado (retorna likes e likedByMe)',
    type: ToggleLikeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  like(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.postsService.toggleLike(id, req.user.sub);
  }
}
