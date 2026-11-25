import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UserRole } from '../common/enums/roles.enums.js';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // TODO: anteponer JwtAuthGuard cuando exista auth (PR #3). Su JwtStrategy puebla
  // req.user = { userId, email, role }; RolesGuard lee req.user.role.
  @Post('service-requests/:id/reviews')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto,
    @Req() req: { user?: { userId: string } },
  ) {
    if (!req.user?.userId) throw new UnauthorizedException();
    return this.reviewsService.create(req.user.userId, id, dto);
  }

  @Get('technicians/:id/reviews')
  findByTechnician(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findByTechnician(id);
  }
}
