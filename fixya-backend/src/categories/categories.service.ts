import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

const DEFAULT_CATEGORIES: CreateCategoryDto[] = [
  { name: 'Plomería', description: 'Fugas, destapes, grifería y reparación de tuberías.' },
  { name: 'Electricidad', description: 'Instalaciones, tomas, breakers y revisión de cortos.' },
  { name: 'Cerrajería', description: 'Apertura de puertas, cambio de guardas y cerraduras.' },
  { name: 'Pintura', description: 'Pintura de interiores y exteriores, estuco y acabados.' },
  { name: 'Jardinería', description: 'Poda, mantenimiento de jardines y zonas verdes.' },
  { name: 'Pañetes y enchapes', description: 'Pañete, enchape de pisos y paredes, reparaciones de obra.' },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  /** Carga categorías base si la tabla está vacía, para que el catálogo público no salga vacío. */
  async onModuleInit() {
    if ((await this.categoriesRepository.count()) === 0) {
      await this.categoriesRepository.save(
        DEFAULT_CATEGORIES.map((c) => this.categoriesRepository.create(c)),
      );
    }
  }

  async create(dto: CreateCategoryDto) {
    await this.assertNameAvailable(dto.name);
    return this.categoriesRepository.save(this.categoriesRepository.create(dto));
  }

  findAll() {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Categoría #${id} no encontrada`);
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (dto.name && dto.name !== category.name) {
      await this.assertNameAvailable(dto.name);
    }
    return this.categoriesRepository.save({ ...category, ...dto });
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
    return { deleted: true, id };
  }

  private async assertNameAvailable(name: string) {
    const exists = await this.categoriesRepository.findOne({ where: { name } });
    if (exists) throw new ConflictException(`Ya existe la categoría "${name}"`);
  }
}
