import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Sobre nós')
@Controller('about')
export class AboutController {
  @Get()
  @ApiOperation({ summary: 'Conteúdo da página Sobre nós' })
  @ApiResponse({ status: 200, description: 'Conteúdo retornado com sucesso' })
  getAbout() {
    return {
      hero: {
        title: 'Bem-Vindo ao CodeConnect!',
        subtitle: 'Onde a comunidade e o código se unem!',
        image:
          'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80',
      },
      intro:
        'No coração da revolução digital está a colaboração. CodeConnect nasceu da visão de criar um espaço onde desenvolvedores, programadores e entusiastas de tecnologia podem se conectar, aprender e colaborar de maneira inigualável. Somos uma comunidade global apaixonada por código e estamos comprometidos em oferecer um ambiente inclusivo e inspirador para todos os níveis de habilidade.',
      sections: [
        {
          title: 'Nossa Missão',
          content:
            'Na CodeConnect, acreditamos que a colaboração é a essência da inovação. Nossa missão é fornecer uma plataforma onde as mentes criativas possam se unir, compartilhar conhecimento e desenvolver projetos extraordinários. Quer você seja um novato ansioso para aprender ou um veterano experiente, você encontrará aqui um lar para suas aspirações tecnológicas.',
          image:
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'Junte-se a Nós!',
          content:
            'Estamos animados para ter você conosco nesta jornada empolgante. Junte-se à nossa comunidade vibrante e descubra o poder da colaboração no mundo do código.',
          image: '',
        },
      ],
      cta: 'Juntos, vamos transformar ideias em inovações e moldar o futuro digital.',
    };
  }
}
