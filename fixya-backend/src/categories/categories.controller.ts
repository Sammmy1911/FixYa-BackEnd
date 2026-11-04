import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../common/enums/roles.enums.js';
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}
  @Get() list() { return this.service.findAll(); }
  @Get(':id') get(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCategoryDto) { return this.service.create(dto); }
  @Patch(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)
  edit(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) { return this.service.update(id, dto); }
  @Delete(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
