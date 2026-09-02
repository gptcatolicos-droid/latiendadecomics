import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { sectionSchema } from '@/modules/catalog/schemas';

export async function GET(req:NextRequest){const auth=await requireAdmin(req);if(auth)return auth;const page=new URL(req.url).searchParams.get('page')||'homepage';const rows=await query('SELECT * FROM store_sections WHERE page_key=$1 ORDER BY position,created_at',[page]);return NextResponse.json({success:true,data:rows.rows});}
export async function POST(req:NextRequest){return save(req,false);}
export async function PUT(req:NextRequest){return save(req,true);}
async function save(req:NextRequest,update:boolean){const auth=await requireAdmin(req);if(auth)return auth;const parsed=(update?sectionSchema.required({id:true}):sectionSchema).safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({success:false,error:parsed.error.issues[0]?.message||'Datos inválidos'},{status:400});const v=parsed.data;const id=v.id||randomUUID();const row=update?await query(`UPDATE store_sections SET page_key=$2,section_type=$3,name=$4,status=$5,position=$6,config=$7,scheduled_at=$8,expires_at=$9,updated_at=NOW() WHERE id=$1 RETURNING *`,[id,v.page_key,v.section_type,v.name,v.status,v.position,JSON.stringify(v.config),v.scheduled_at||null,v.expires_at||null]):await query(`INSERT INTO store_sections(id,page_key,section_type,name,status,position,config,scheduled_at,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[id,v.page_key,v.section_type,v.name,v.status,v.position,JSON.stringify(v.config),v.scheduled_at||null,v.expires_at||null]);return NextResponse.json({success:true,data:row.rows[0]},{status:update?200:201});}
export async function DELETE(req:NextRequest){const auth=await requireAdmin(req);if(auth)return auth;const id=new URL(req.url).searchParams.get('id');if(!id)return NextResponse.json({success:false,error:'ID requerido'},{status:400});await query('DELETE FROM store_sections WHERE id=$1',[id]);return NextResponse.json({success:true});}
