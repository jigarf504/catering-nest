import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { SubCategoryModule } from './sub-category/sub-category.module';
import { AccessTokenGuard } from './auth/guards/access-token.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // Load .env globally
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CategoryModule,
    SubCategoryModule,
  ],
  providers: [
    // Global JWT guard — all routes require auth by default
    // Use @Public() decorator to exempt specific routes
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    // Global roles guard — checks @Roles() decorator
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
