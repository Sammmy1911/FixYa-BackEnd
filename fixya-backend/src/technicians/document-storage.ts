import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_DOCUMENTS = 5;
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5 MB

type Kind = { ext: string; magic: number[] };
const ALLOWED: Record<string, Kind> = {
  'application/pdf': { ext: '.pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  'image/jpeg': { ext: '.jpg', magic: [0xff, 0xd8, 0xff] },
  'image/png': { ext: '.png', magic: [0x89, 0x50, 0x4e, 0x47] },
};

/** Verifica tipo declarado Y los bytes reales (el mimetype lo manda el cliente). */
export function assertValidDocument(file: Express.Multer.File) {
  const kind = ALLOWED[file.mimetype];
  if (!kind) {
    throw new BadRequestException(`"${file.originalname}": solo se permiten PDF, JPG o PNG`);
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new BadRequestException(`"${file.originalname}" supera los 5 MB`);
  }
  const header = file.buffer.subarray(0, kind.magic.length);
  if (!kind.magic.every((byte, i) => header[i] === byte)) {
    throw new BadRequestException(`"${file.originalname}" no es un ${kind.ext.slice(1).toUpperCase()} válido`);
  }
}

export function uploadsDir() {
  return process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads', 'technician-documents');
}

/** Guarda en disco con nombre aleatorio y devuelve las rutas relativas a uploadsDir(). */
export async function saveDocuments(files: Express.Multer.File[]): Promise<string[]> {
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  const saved: string[] = [];
  try {
    for (const file of files) {
      const name = `${randomUUID()}${ALLOWED[file.mimetype].ext}`;
      await writeFile(join(dir, name), file.buffer);
      saved.push(name);
    }
    return saved;
  } catch (error) {
    await deleteDocuments(saved);
    throw error;
  }
}

export async function deleteDocuments(names: string[]) {
  await Promise.all(names.map((n) => unlink(join(uploadsDir(), n)).catch(() => undefined)));
}

