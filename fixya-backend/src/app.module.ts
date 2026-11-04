
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ServiceRequestsModule } from './service-requests/service-requests.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/.env`,
      ignoreEnvFile: false,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        if (!databaseUrl) {
          throw new Error(
            'DATABASE_URL no está definida en el archivo .env',
          );
        }

        return {
          type: 'postgres' as const,
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: configService.get<string>('DB_SYNC') === 'true',
          ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: true } : false,
          retryAttempts: 5,
          retryDelay: 3000,
        };
      },
    }),

    UsersModule,
    AuthModule,
    CategoriesModule,
    ServiceRequestsModule,
  ],
})
export class AppModule {}
