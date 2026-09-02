import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req:NextRequest){const auth=await requireAdmin(req);if(auth)return auth;const range=Math.min(365,Math.max(1,Number(new URL(req.url).searchParams.get('days')||30)));const [connections,summary,volumes,transactions,refunds,webhooks]=await Promise.all([
  query('SELECT provider,display_name,enabled,status,mode,last_connected_at,last_error FROM payment_connections ORDER BY enabled DESC,display_name'),
  query(`SELECT COUNT(*) FILTER(WHERE status='approved')::int AS approved_count,COUNT(*) FILTER(WHERE status='pending')::int AS pending_count,COUNT(*) FILTER(WHERE status IN ('failed','rejected','needs_review'))::int AS failed_count FROM payment_transactions WHERE occurred_at>=NOW()-($1::text||' days')::interval`,[range]),
  query(`SELECT currency,COALESCE(SUM(amount_minor) FILTER(WHERE status='approved'),0)::bigint AS gross_minor,COALESCE(SUM(fee_minor) FILTER(WHERE status='approved'),0)::bigint AS fees_minor FROM payment_transactions WHERE occurred_at>=NOW()-($1::text||' days')::interval GROUP BY currency ORDER BY currency`,[range]),
  query(`SELECT pt.*,o.order_number FROM payment_transactions pt LEFT JOIN orders o ON o.id=pt.order_id ORDER BY pt.occurred_at DESC LIMIT 100`),
  query(`SELECT pr.*,pt.provider,pt.external_id AS transaction_external_id FROM payment_refunds pr JOIN payment_transactions pt ON pt.id=pr.transaction_id ORDER BY pr.created_at DESC LIMIT 50`),
  query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='failed')::int AS failed,MAX(created_at) AS last_event FROM payment_webhook_events WHERE created_at>=NOW()-($1::text||' days')::interval`,[range])
]);
const configured=new Set<string>();if(process.env.MP_ACCESS_TOKEN)configured.add('mercadopago');if(process.env.PAYPAL_CLIENT_ID&&process.env.PAYPAL_CLIENT_SECRET)configured.add('paypal');if(process.env.STRIPE_SECRET_KEY)configured.add('stripe');if(process.env.WOMPI_PRIVATE_KEY)configured.add('wompi');
const gatewayData=connections.rows.map(row=>({...row,configured:configured.has(row.provider),status:configured.has(row.provider)?(row.status==='error'?'error':'configured'):'not_connected'}));
return NextResponse.json({success:true,data:{range_days:range,summary:summary.rows[0],volumes:volumes.rows,connections:gatewayData,transactions:transactions.rows,refunds:refunds.rows,webhooks:webhooks.rows[0]}});}
