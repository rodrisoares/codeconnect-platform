import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { UploadResponseDto } from './dto/upload-response.dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de imagem (retorna a URL pública)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Imagem enviada com sucesso',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido' })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        // Exige mimetype de imagem E extensão em uma lista permitida
        const allowedExt = /\.(png|jpe?g|webp|gif)$/i;
        const isImageMime = file.mimetype.startsWith('image/');
        const hasAllowedExt = allowedExt.test(file.originalname);
        if (!isImageMime || !hasAllowedExt) {
          return cb(
            new BadRequestException(
              'Formato inválido. Envie uma imagem PNG, JPG, WEBP ou GIF (até 5MB).',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    return { url, filename: file.originalname };
  }
}
