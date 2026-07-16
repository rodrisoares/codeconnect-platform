import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma: PrismaClient = new PrismaClient();

// As capas são servidas pelo frontend (Vite) a partir de src/assets/covers.
// Em dev, /src/assets/... é acessível diretamente pela URL.
const COVER_BASE = '/src/assets/covers';

// ---- Usuários  ----
const users = [
  {
    name: 'Rodrigo Almeida',
    username: 'rodrigo.almeida',
    email: 'rodrigo@codeconnect.dev',
    bio: 'Desenvolvedor front-end, especialista em Vue e React.',
  },
  {
    name: 'Marina Costa',
    username: 'marina.dev',
    email: 'marina@codeconnect.dev',
    bio: 'Front-end em React e apaixonada por design systems.',
  },
  {
    name: 'Rafael Lima',
    username: 'rafalima',
    email: 'rafael@codeconnect.dev',
    bio: 'Dev back-end Node/Nest. Curto arquitetura limpa e um bom café.',
  },
  {
    name: 'Juliana Alves',
    username: 'juh.alves',
    email: 'juliana@codeconnect.dev',
    bio: 'Full-stack, TypeScript e acessibilidade web de verdade.',
  },
  {
    name: 'Pedro Henrique',
    username: 'pedroh',
    email: 'pedro@codeconnect.dev',
    bio: 'Aprendendo Vue e compartilhando o caminho por aqui.',
  },
  {
    name: 'Camila Rocha',
    username: 'camirocha',
    email: 'camila@codeconnect.dev',
    bio: 'CSS, animações e a arte de fazer layouts responsivos.',
  },
  {
    name: 'Lucas Ferreira',
    username: 'lucasfe',
    email: 'lucas@codeconnect.dev',
    bio: 'Performance, build tools e developer experience.',
  },
];

// Índices dos usuários (para legibilidade)
const RODRIGO = 0;
const MARINA = 1;
const RAFAEL = 2;
const JULIANA = 3;
const PEDRO = 4;
const CAMILA = 5;
const LUCAS = 6;

// ---- Posts (capas locais + tags + autor explícito). ----
// Rodrigo (Vue/React) é autor dos posts de React e Vue.
const posts = [
  {
    title: 'Introdução ao React',
    slug: 'introducao-ao-react',
    authorIndex: RODRIGO,
    tags: ['React', 'Front-end', 'JavaScript'],
    body: 'Conceitos essenciais do React: componentes, JSX, props e estado. Um ponto de partida prático para quem está começando na biblioteca.',
    markdown:
      "```jsx\nfunction Ola({ nome }) {\n  return <h1>Olá, {nome}!</h1>\n}\n```",
  },
  {
    title: 'CSS Grid na Prática',
    slug: 'css-grid-na-pratica',
    authorIndex: CAMILA,
    tags: ['CSS', 'Layout', 'Front-end'],
    body: 'Como montar layouts responsivos e complexos de forma simples usando CSS Grid, com exemplos do básico ao avançado.',
    markdown:
      '```css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 16px;\n}\n```',
  },
  {
    title: 'Vue.js para Iniciantes',
    slug: 'vuejs-para-iniciantes',
    authorIndex: RODRIGO,
    tags: ['Vue', 'Front-end', 'JavaScript'],
    body: 'Um guia introdutório ao Vue.js, cobrindo reatividade, diretivas e a estrutura de um componente.',
    markdown:
      "```js\nconst app = Vue.createApp({\n  data: () => ({ msg: 'Olá Vue!' })\n})\n```",
  },
  {
    title: 'Dicas de Acessibilidade Web',
    slug: 'dicas-de-acessibilidade-web',
    authorIndex: JULIANA,
    tags: ['Acessibilidade', 'HTML', 'Front-end'],
    body: 'Boas práticas para tornar seus sites acessíveis: semântica, contraste, foco e ARIA usado com moderação.',
    markdown: '```html\n<button aria-label="Fechar">✕</button>\n```',
  },
  {
    title: 'Introdução ao TypeScript',
    slug: 'introducao-ao-typescript',
    authorIndex: JULIANA,
    tags: ['TypeScript', 'JavaScript'],
    body: 'Como o TypeScript melhora a manutenção do código com tipagem estática, interfaces e inferência.',
    markdown:
      "```ts\nfunction saudar(nome: string): string {\n  return `Olá, ${nome}`\n}\n```",
  },
  {
    title: 'Otimização de Performance no React',
    slug: 'otimizacao-de-performance-no-react',
    authorIndex: RODRIGO,
    tags: ['React', 'Performance'],
    body: 'Técnicas para deixar apps React mais rápidos: memoização, lazy loading e evitar re-renders desnecessários.',
    markdown:
      '```jsx\nconst Lista = React.memo(function Lista(props) {\n  /* ... */\n})\n```',
  },
  {
    title: 'Explorando Flexbox no CSS',
    slug: 'explorando-flexbox-no-css',
    authorIndex: CAMILA,
    tags: ['CSS', 'Layout'],
    body: 'O Flexbox descomplicado: eixos, alinhamento e distribuição de espaço para interfaces flexíveis.',
    markdown:
      '```css\n.row {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n```',
  },
  {
    title: 'Angular: Primeiros Passos',
    slug: 'angular-primeiros-passos',
    authorIndex: PEDRO,
    tags: ['Angular', 'TypeScript', 'Front-end'],
    body: 'Uma introdução ao Angular, apresentando componentes, módulos e templates com um exemplo simples.',
    markdown:
      "```ts\n@Component({\n  selector: 'app-root',\n  template: '<h1>Olá Angular</h1>'\n})\nexport class AppComponent {}\n```",
  },
  {
    title: 'Gerenciamento de Estado com Redux',
    slug: 'gerenciamento-de-estado-com-redux',
    authorIndex: MARINA,
    tags: ['React', 'Redux', 'Estado'],
    body: 'Como o Redux organiza o estado da aplicação com store, actions e reducers de forma previsível.',
    markdown:
      "```js\nconst reducer = (state, action) => {\n  switch (action.type) {\n    case 'INC': return { ...state, n: state.n + 1 }\n    default: return state\n  }\n}\n```",
  },
  {
    title: 'Sass: Simplificando o CSS',
    slug: 'sass-simplificando-o-css',
    authorIndex: CAMILA,
    tags: ['CSS', 'Sass'],
    body: 'Variáveis, mixins e aninhamento: como o Sass deixa a escrita de CSS mais organizada e reutilizável.',
    markdown:
      '```scss\n$cor: #81FE88;\n.botao {\n  background: $cor;\n  &:hover { opacity: .85; }\n}\n```',
  },
  {
    title: 'Webpack: Um Guia para Iniciantes',
    slug: 'webpack-um-guia-para-iniciantes',
    authorIndex: LUCAS,
    tags: ['Webpack', 'Build', 'JavaScript'],
    body: 'Entenda os conceitos de entry, output, loaders e plugins para empacotar seus módulos.',
    markdown:
      "```js\nmodule.exports = {\n  entry: './src/index.js',\n  output: { filename: 'bundle.js' }\n}\n```",
  },
  {
    title: 'Construindo SPA com Vue.js',
    slug: 'construindo-spa-com-vuejs',
    authorIndex: RODRIGO,
    tags: ['Vue', 'SPA', 'Front-end'],
    body: 'Passo a passo para criar uma Single Page Application com Vue Router e componentes reutilizáveis.',
    markdown:
      "```js\nconst router = createRouter({\n  history: createWebHistory(),\n  routes\n})\n```",
  },
];

const commentTexts = [
  'Ótimo post, muito didático!',
  'Salvando aqui pra aplicar depois. Valeu!',
  'Faltou falar de testes, mas ficou excelente.',
  'Esse exemplo me ajudou demais, obrigado(a)!',
  'Conteúdo top, continua assim!',
  'Não sabia dessa abordagem, curti bastante.',
  'Explicação clara e direta, parabéns.',
  'Compartilhando com a galera do time.',
];

const replyTexts = [
  'Boa! Complementando: dá pra combinar com hooks também.',
  'Concordo, esse ponto é essencial.',
  'Verdade, faz total sentido.',
  'Obrigado pelo complemento!',
  'Tinha essa mesma dúvida, valeu por perguntar.',
];

// ---- Utilitários ----
const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const sample = <T>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const count = Math.min(n, copy.length);
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

async function notify(
  userId: string,
  actorId: string,
  type: string,
  postId: number | null,
): Promise<void> {
  if (userId === actorId) return; // ninguém é notificado das próprias ações
  await prisma.notification.create({
    data: { userId, actorId, type, postId },
  });
}

// Cria um follow evitando duplicatas (e notifica só quando é novo)
async function createFollow(
  followerId: string,
  followingId: string,
): Promise<void> {
  if (followerId === followingId) return;
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (existing) return;
  await prisma.follow.create({ data: { followerId, followingId } });
  await notify(followingId, followerId, 'FOLLOW', null);
}

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed...');

  // Limpeza (ordem segura em relação às foreign keys)
  console.log('🧹 Limpando dados existentes...');
  await prisma.notification.deleteMany({});
  await prisma.commentLike.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});

  // Usuários
  console.log('👥 Criando usuários...');
  // Senha compatível com as regras do app (8+ chars, maiúscula, minúscula e número)
  const hashedPassword = await bcrypt.hash('Code1234', 10);
  const userIds: string[] = [];
  for (const u of users) {
    const created = await prisma.user.create({
      data: { ...u, password: hashedPassword },
    });
    userIds.push(created.id);
    console.log(`✅ ${created.name} (@${created.username})`);
  }

  // Posts + interações aleatórias
  console.log('📝 Criando posts e interações...');
  const createdPosts: { id: number; authorId: string }[] = [];

  for (const p of posts) {
    const authorId = userIds[p.authorIndex];

    const post = await prisma.post.create({
      data: {
        cover: `${COVER_BASE}/${p.slug}.png`,
        title: p.title,
        slug: p.slug,
        body: p.body,
        markdown: p.markdown,
        tags: JSON.stringify(p.tags),
        status: 'PUBLISHED',
        authorId,
      },
    });
    createdPosts.push({ id: post.id, authorId });

    // Curtidas no post (contador é derivado da tabela Like)
    const likers = sample(
      userIds.filter((id) => id !== authorId),
      randInt(1, userIds.length - 1),
    );
    for (const likerId of likers) {
      await prisma.like.create({ data: { userId: likerId, postId: post.id } });
      await notify(authorId, likerId, 'LIKE', post.id);
    }

    // Comentários (raiz) + curtidas de comentário + eventuais respostas
    const nComments = randInt(1, 3);
    for (let c = 0; c < nComments; c++) {
      const commenterId = pick(userIds);
      const comment = await prisma.comment.create({
        data: { text: pick(commentTexts), postId: post.id, authorId: commenterId },
      });
      await notify(authorId, commenterId, 'COMMENT', post.id);

      const commentLikers = sample(
        userIds.filter((id) => id !== commenterId),
        randInt(0, 3),
      );
      for (const clId of commentLikers) {
        await prisma.commentLike.create({
          data: { userId: clId, commentId: comment.id },
        });
        await notify(commenterId, clId, 'COMMENT_LIKE', post.id);
      }

      if (Math.random() > 0.5) {
        const replierId = pick(userIds);
        await prisma.comment.create({
          data: {
            text: pick(replyTexts),
            postId: post.id,
            authorId: replierId,
            parentId: comment.id,
          },
        });
        await notify(commenterId, replierId, 'COMMENT', post.id);
      }
    }

    console.log(`✅ Post "${post.title}" com interações`);
  }

  // Interações explícitas do Rodrigo com posts de outras pessoas
  console.log('💬 Comentários do Rodrigo na comunidade...');
  const rodrigo = userIds[RODRIGO];
  const rodrigoComments = [
    {
      slug: 'css-grid-na-pratica',
      text: 'Layout ficou show! Uso Grid direto nos meus projetos Vue e React.',
    },
    {
      slug: 'webpack-um-guia-para-iniciantes',
      text: 'Migrei do Webpack pro Vite nos últimos projetos, mas o guia é ótimo pra entender a base.',
    },
    {
      slug: 'dicas-de-acessibilidade-web',
      text: 'Acessibilidade é item obrigatório. Ótimas dicas!',
    },
  ];
  for (const rc of rodrigoComments) {
    const idx = posts.findIndex((p) => p.slug === rc.slug);
    const target = createdPosts[idx];
    await prisma.comment.create({
      data: { text: rc.text, postId: target.id, authorId: rodrigo },
    });
    await notify(target.authorId, rodrigo, 'COMMENT', target.id);
    // Rodrigo também curte esses posts (evitando duplicar caso já tenha curtido)
    const alreadyLiked = await prisma.like.findUnique({
      where: { userId_postId: { userId: rodrigo, postId: target.id } },
    });
    if (!alreadyLiked && target.authorId !== rodrigo) {
      await prisma.like.create({ data: { userId: rodrigo, postId: target.id } });
      await notify(target.authorId, rodrigo, 'LIKE', target.id);
    }
  }

  // Conexões (follows)
  console.log('🔗 Criando conexões (follows)...');
  // Rodrigo segue alguns colegas...
  await createFollow(rodrigo, userIds[MARINA]);
  await createFollow(rodrigo, userIds[CAMILA]);
  await createFollow(rodrigo, userIds[LUCAS]);
  // ...e é seguido por outros
  await createFollow(userIds[RAFAEL], rodrigo);
  await createFollow(userIds[JULIANA], rodrigo);
  await createFollow(userIds[PEDRO], rodrigo);

  // Demais conexões aleatórias entre todos (todo mundo segue de 2 a 4 pessoas)
  for (const followerId of userIds) {
    const toFollow = sample(
      userIds.filter((id) => id !== followerId),
      randInt(2, 4),
    );
    for (const followingId of toFollow) {
      await createFollow(followerId, followingId);
    }
  }

  // Bookmarks (posts salvos)
  console.log('🔖 Criando bookmarks...');
  const postIds = createdPosts.map((p) => p.id);
  for (const userId of userIds) {
    const toSave = sample(postIds, randInt(2, 4));
    for (const postId of toSave) {
      await prisma.bookmark.create({ data: { userId, postId } });
    }
  }

  console.log('🎉 Seed concluído com sucesso!');
  console.log('👉 Login de teste: qualquer e-mail acima com a senha "Code1234"');
  console.log('   Ex.: rodrigo@codeconnect.dev / Code1234');
}

main()
  .catch((e: Error) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
