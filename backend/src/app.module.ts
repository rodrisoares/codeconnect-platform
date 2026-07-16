import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { AuthModule } from './auth/auth.module';
import { UploadsModule } from './uploads/uploads.module';
import { AboutModule } from './about/about.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite padrão de requisições (aplicado onde o ThrottlerGuard é usado)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    UsersModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    UploadsModule,
    AboutModule,
    NotificationsModule,
    BookmarksModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
