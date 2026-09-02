import { query } from '@/lib/db';
import type { Order } from '@/types';

export async function parseOrder(row: any): Promise<Order> {
  const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [row.id]);
  return {
    id: row.id,
    order_number: row.order_number,
    status: row.status,
    payment_status: row.payment_status,
    customer: { name: row.customer_name, email: row.customer_email, phone: row.customer_phone, country: row.customer_country },
    items: itemsRes.rows.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_title: item.product_title,
      product_image: item.product_image,
      quantity: item.quantity,
      price_usd: Number(item.price_usd),
      supplier_url: item.supplier_url,
      is_preventa: Boolean(item.is_preventa),
      preventa_amount_paid: item.preventa_amount_paid ? Number(item.preventa_amount_paid) : undefined,
      preventa_remaining: item.preventa_remaining ? Number(item.preventa_remaining) : undefined,
    })),
    subtotal_usd: Number(row.subtotal_usd),
    shipping_usd: Number(row.shipping_usd),
    discount_usd: Number(row.discount_usd),
    total_usd: Number(row.total_usd),
    total_cop: Number(row.total_cop),
    shipping_zone: row.shipping_zone,
    shipping_address: {
      line1: row.shipping_line1, line2: row.shipping_line2, city: row.shipping_city,
      state: row.shipping_state, postal_code: row.shipping_postal,
      country: row.shipping_country, country_code: row.shipping_country_code,
    },
    coupon_code: row.coupon_code,
    payment_id: row.payment_id,
    payment_method: row.payment_method,
    tracking_number: row.tracking_number,
    tracking_carrier: row.tracking_carrier,
    tracking_notified_at: row.tracking_notified_at,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

