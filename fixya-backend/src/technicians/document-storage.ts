
import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_DOCUMENTS = 5;
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

const logger = new Logger('DocumentStorage');

type Kind = { ext: string; magic: number[] };

const ALLOWED: Record<string, Kind> = {
  'application/pdf': {
    ext: '.pdf',
    magic: [0x25, 0x50, 0x44, 0x46],
  },
  'image/jpeg': {
    ext: '.jpg',
    magic: [0xff, 0xd8, 0xff],
  },
  'image/png': {
    ext: '.png',
    magic: [0x89, 0x50, 0x4e, 0x47],
  },
};

export function assertValidDocument(file: Express.Multer.File) {
  const kind = ALLOWED[file.mimetype];

  if (!kind) {
    throw new BadRequestException(
      `"${file.originalname}": solo se permiten PDF, JPG o PNG`,
    );
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new BadRequestException(
      `"${file.originalname}" supera los 5 MB`,
    );
  }

  const header = file.buffer.subarray(0, kind.magic.length);

  if (!kind.magic.every((byte, i) => header[i] === byte)) {
    throw new BadRequestException(
      `"${file.originalname}" no es un archivo válido`,
    );
  }
}

export function uploadsDir() {
  return (
    process.env.UPLOADS_DIR ??
    join(process.cwd(), 'uploads', 'technician-documents')
  );
}

function useCloudStorage() {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.SUPABASE_URL ||
      process.env.SUPABASE_SECRET_KEY)
  );
}

function cloudBucket() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new InternalServerErrorException(
      'Almacenamiento remoto no configurado',
    );
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return client.storage.from(
    process.env.SUPABASE_STORAGE_BUCKET ??
      'technician-documents',
  );
}

export async function saveDocuments(
  files: Express.Multer.File[],
): Promise<string[]> {
  const cloud = useCloudStorage();
  const bucket = cloud ? cloudBucket() : null;

  if (!cloud) {
    await mkdir(uploadsDir(), { recursive: true });
  }

  const saved: string[] = [];

  try {
    for (const file of files) {
      assertValidDocument(file);

      const name =
        `${randomUUID()}${ALLOWED[file.mimetype].ext}`;

      if (bucket) {
        const { error } = await bucket.upload(
          name,
          file.buffer,
          {
            contentType: file.mimetype,
            upsert: false,
          },
        );

        if (error) {
          logger.error('Error al subir documento');
          throw new InternalServerErrorException(
            'No se pudo almacenar el documento',
          );
        }
      } else {
        await writeFile(
          join(uploadsDir(), name),
          file.buffer,
        );
      }

      saved.push(name);
    }

    return saved;
  } catch (error) {
    await deleteDocuments(saved);
    throw error;
  }
}

export async function deleteDocuments(names: string[]) {
  if (names.length === 0) return;

  if (useCloudStorage()) {
    try {
      const { error } = await cloudBucket().remove(names);

      if (error) {
        logger.warn('No se pudieron eliminar documentos');
      }
    } catch {
      logger.warn('Error de limpieza del almacenamiento');
    }

    return;
  }

  await Promise.all(
    names.map((name) =>
      unlink(join(uploadsDir(), name)).catch(
        () => undefined,
      ),
    ),
  );
}
