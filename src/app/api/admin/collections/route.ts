import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';
import { collectionSchema } from '@/modules/catalog/schemas';

export async function GET(req: NextRequest) {
  const auth=await requireAdmin(req); if(auth)return auth;
  const rows=await query(`SELECT c.*, COUNT(cp.product_id)::int AS product_count,COALESCE(json_agg(cp.product_id ORDER BY cp.sort_order) FILTER(WHERE cp.product_id IS NOT NULL),'[]') AS product_ids FROM collections c LEFT JOIN collection_products cp ON cp.collection_id=c.id GROUP BY c.id ORDER BY c.sort_order,c.name`);
  return NextResponse.json({success:true,data:rows.rows});
}

export async function POST(req: NextRequest) { return save(req,false); }
export async function PUT(req: NextRequest) { return save(req,true); }

async function save(req:NextRequest, update:boolean) {
  const auth=await requireAdmin(req); if(auth)return auth;
  const parsed=(update?collectionSchema.required({id:true}):collectionSchema).safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({success:false,error:parsed.error.issues[0]?.message||'Datos inválidos'},{status:400});
  const value=parsed.data; const id=value.id||randomUUID();
  const result=await withTransaction(async client=>{
    const row=update
      ? await client.query(`UPDATE collections SET name=$2,slug=$3,description=$4,status=$5,collection_type=$6,rules=$7,sort_order=$8,updated_at=NOW() WHERE id=$1 RETURNING *`,[id,value.name,value.slug,value.description,value.status,value.collection_type,JSON.stringify(value.rules),value.sort_order])
      : await client.query(`INSERT INTO collections(id,name,slug,description,status,collection_type,rules,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[id,value.name,value.slug,value.description,value.status,value.collection_type,JSON.stringify(value.rules),value.sort_order]);
    if(value.collection_type==='manual'){
      await client.query('DELETE FROM collection_products WHERE collection_id=$1',[id]);
      for(let i=0;i<value.product_ids.length;i++) await client.query('INSERT INTO collection_products(collection_id,product_id,sort_order) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,value.product_ids[i],i]);
    }
    return row.rows[0];
  });
  return NextResponse.json({success:true,data:result},{status:update?200:201});
}

export async function DELETE(req:NextRequest){const auth=await requireAdmin(req);if(auth)return auth;const id=new URL(req.url).searchParams.get('id');if(!id)return NextResponse.json({success:false,error:'ID requerido'},{status:400});await query('DELETE FROM collections WHERE id=$1',[id]);return NextResponse.json({success:true});}
