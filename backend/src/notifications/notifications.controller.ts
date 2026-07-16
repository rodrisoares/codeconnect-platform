import {
  Controller,
  Get,
  Patch,
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
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Notificações')
@Controller('notifications')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário logado' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  findAll(@Request() req: RequestWithUser) {
    return this.notificationsService.findAllForUser(req.user.sub);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Quantidade de notificações não lidas' })
  @ApiResponse({ status: 200, description: 'Contagem retornada com sucesso' })
  unreadCount(@Request() req: RequestWithUser) {
    return this.notificationsService.unreadCount(req.user.sub);
  }

  @Patch('read')
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiResponse({ status: 200, description: 'Notificações marcadas como lidas' })
  markAllRead(@Request() req: RequestWithUser) {
    return this.notificationsService.markAllRead(req.user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar uma notificação como lida' })
  @ApiParam({ name: 'id', description: 'ID da notificação', type: 'number' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida' })
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.notificationsService.markRead(id, req.user.sub);
  }
}
