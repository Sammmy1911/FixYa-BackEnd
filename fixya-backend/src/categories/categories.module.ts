import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service.js';
import { CategoriesController } from './categories.controller.js';
import { Category } from './entities/category.entity.js';
import { AuthModule } from '../auth/auth.module.js';
@Module({ imports: [TypeOrmModule.forFeature([Category]), AuthModule], controllers: [CategoriesController], providers: [CategoriesService] })
export class CategoriesModule {}
