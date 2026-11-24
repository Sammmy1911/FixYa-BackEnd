import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TechniciansService } from './technicians.service.js';
import { RegisterTechnicianDto } from './dto/register-technician.dto.js';
import { MAX_DOCUMENTS, MAX_DOCUMENT_SIZE } from './document-storage.js';

@Controller('technicians')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  /**
   * POST /technicians/register  (multipart/form-data)
   * campos: email, password, fullName
   * archivos: documents (1 a 5; PDF/JPG/PNG, máx 5 MB c/u)
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('documents', MAX_DOCUMENTS, {
      limits: { fileSize: MAX_DOCUMENT_SIZE },
    }),
  )
  register(
    @Body() dto: RegisterTechnicianDto,
    @UploadedFiles() documents: Express.Multer.File[],
  ) {
    return this.techniciansService.register(dto, documents);
  }
}
