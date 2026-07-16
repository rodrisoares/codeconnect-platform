import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    example: 'http://localhost:3000/uploads/cover.png',
    description: 'URL da imagem de capa do post',
  })
  // require_tld: false permite URLs de host sem TLD (ex.: http://localhost:3000)
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  cover: string;

  @ApiProperty({
    example: 'Introdução ao React',
    description: 'Título / nome do projeto',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Neste post, vamos explorar os conceitos básicos do React...',
    description: 'Descrição / corpo do post',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    example: ['React', 'Front-end'],
    description: 'Lista de tags do post',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    example: 'introducao-ao-react',
    description: 'Slug único do post (gerado a partir do título se omitido)',
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    example:
      '```javascript\nfunction HelloComponent() {\n  return <h1>Hello, world!</h1>;\n}\n```',
    description: 'Código markdown do post (usa a descrição se omitido)',
    required: false,
  })
  @IsOptional()
  @IsString()
  markdown?: string;

  @ApiProperty({
    example: 'PUBLISHED',
    description: 'Estado de publicação do post',
    required: false,
    enum: ['DRAFT', 'PUBLISHED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED'])
  status?: string;
}
