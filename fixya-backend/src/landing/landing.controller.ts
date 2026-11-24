import { Controller, Get } from '@nestjs/common';
import { LandingService } from './landing.service.js';

@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  /** Público, sin autenticación: servicios, cómo funciona y señales de confianza. */
  @Get()
  getLanding() {
    return this.landingService.getLanding();
  }
}
