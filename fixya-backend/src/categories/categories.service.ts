import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private readonly categories: Repository<Category>) {}
  create(dto: CreateCategoryDto) { return this.categories.save(this.categories.create(dto)); }
  findAll() { return this.categories.find({ order: { name: 'ASC' } }); }
  async findOne(id: number) {
    const value = await this.categories.findOneBy({ id });
    if (!value) throw new NotFoundException('Categoría no encontrada');
    return value;
  }
  async update(id: number, dto: UpdateCategoryDto) { const c = await this.findOne(id); return this.categories.save(this.categories.merge(c,dto)); }
  async remove(id: number) { const c = await this.findOne(id); await this.categories.remove(c); return { deleted: true }; }
}
