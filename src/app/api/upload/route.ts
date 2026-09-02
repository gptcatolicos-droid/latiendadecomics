import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '5') * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function hasValidImageSignature(buffer: Buffer) {
  if (buffer.length < 12) return false;
  const hex = buffer.subarray(0, 12).toString('hex');
  return hex.startsWith('ffd8ff')
    || hex.startsWith('89504e470d0a1a0a')
    || hex.startsWith('474946383761')
    || hex.startsWith('474946383961')
    || (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP');
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_SIZE * 10 + 100_000) {
    return NextResponse.json({ success: false, error: 'Carga demasiado grande' }, { status: 413 });
  }

  const formData = await req.formData();
  const files = formData.getAll('files').filter(value => value instanceof File) as File[];

  if (!files.length) {
    return NextResponse.json({ success: false, error: 'No se recibieron archivos' }, { status: 400 });
  }

  if (files.length > 10) {
    return NextResponse.json({ success: false, error: 'Máximo 10 archivos' }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const uploaded: { url: string; original_name: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: `Archivo ${file.name} supera el límite de ${MAX_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase() || '.jpg';
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowed.includes(ext) || !ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, error: `Formato no permitido: ${ext}` }, { status: 400 });
    }

    const filename = `${uuid()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(buffer)) {
      return NextResponse.json({ success: false, error: `Contenido inválido: ${file.name}` }, { status: 400 });
    }
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;
    uploaded.push({ url, original_name: file.name });
  }

  return NextResponse.json({ success: true, data: uploaded });
}
