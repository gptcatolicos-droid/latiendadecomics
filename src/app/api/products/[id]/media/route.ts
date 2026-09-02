import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req:NextRequest,{params}:{params:{id:string}}){const rows=await query(`SELECT ma.id,ma.kind,ma.url,ma.title,ma.alt_text,ma.metadata,mu.role,mu.sort_order FROM products p JOIN media_usages mu ON mu.entity_type='product' AND mu.entity_id=p.id JOIN media_assets ma ON ma.id=mu.asset_id WHERE (p.id=$1 OR p.slug=$1) AND p.status='published' AND mu.role IN ('gallery','featured','video','audio','embed') ORDER BY mu.sort_order,mu.created_at`,[params.id]);return NextResponse.json({success:true,data:rows.rows});}
