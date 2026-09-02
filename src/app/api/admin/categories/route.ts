import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';
import { categorySchema } from '@/modules/catalog/schemas';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth) return auth;
  const rows = await query(`SELECT c.*, COUNT(p.id)::int AS product_count
    FROM categories c LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id ORDER BY c.sort_order, c.name`);
  return NextResponse.json({ success: true, data: rows.rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth) return auth;
  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const value = parsed.data; const id = value.id || randomUUID();
  const result = await query(`INSERT INTO categories (id,name,slug,description,seo_title,seo_description,parent_id,status,merchandising_mode,sort_order)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [id,value.name,value.slug,value.description,value.seo_title||null,value.seo_description||null,value.parent_id||null,value.status,value.merchandising_mode,value.sort_order]);
  return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth) return auth;
  const parsed = categorySchema.required({ id: true }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const value = parsed.data;
  const result = await withTransaction(async client => {
    const updated = await client.query(`UPDATE categories SET name=$2,slug=$3,description=$4,seo_title=$5,seo_description=$6,parent_id=$7,status=$8,merchandising_mode=$9,sort_order=$10,updated_at=NOW() WHERE id=$1 RETURNING *`, [value.id,value.name,value.slug,value.description,value.seo_title||null,value.seo_description||null,value.parent_id||null,value.status,value.merchandising_mode,value.sort_order]);
    await client.query('UPDATE products SET category=$2 WHERE category_id=$1', [value.id, value.slug]);
    return updated.rows[0];
  });
  return NextResponse.json({ success: true, data: result });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth) return auth;
  const id = new URL(req.url).searchParams.get('id'); if (!id) return invalid('ID requerido');
  await query('DELETE FROM categories WHERE id=$1', [id]);
  return NextResponse.json({ success: true });
}

function invalid(error='Datos inválidos') { return NextResponse.json({ success:false,error }, { status:400 }); }
