import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, ParseBoolPipe } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../common/enums/roles.enums.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private safeUser<T extends { password: string }>(user: T) { const { password, ...safe } = user; return safe; }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() registerDto: RegisterDto) {
    return this.safeUser(await this.usersService.create(registerDto));
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return (await this.usersService.findAll()).map(user => this.safeUser(user));
  }

  @Get('technicians')
  @Roles(UserRole.ADMIN)
  listTechnicians() {
    return this.usersService.listTechnicians();
  }

  @Patch('technicians/:id/verification')
  @Roles(UserRole.ADMIN)
  verifyTechnician(@Param('id', ParseUUIDPipe) id: string, @Body('isVerified', ParseBoolPipe) verified: boolean) {
    return this.usersService.setTechnicianVerified(id, verified);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.safeUser(await this.usersService.findOne(id));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.safeUser(await this.usersService.update(id, updateData));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}