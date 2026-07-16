import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    example: 'http://localhost:3000/uploads/1712345678901-123456789.png',
    description: 'URL pública da imagem enviada',
  })
  url: string;

  @ApiProperty({
    example: 'avatar.png',
    description: 'Nome original do arquivo enviado',
  })
  filename: string;
}
