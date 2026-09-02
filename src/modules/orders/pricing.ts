export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateDiscount(
  subtotal: number,
  coupon?: { type: string; value: number } | null
) {
  if (!coupon) return 0;
  if (coupon.type === 'percentage') {
    const percentage = Math.min(100, Math.max(0, coupon.value));
    return roundMoney(subtotal * (percentage / 100));
  }
  if (coupon.type === 'fixed') {
    return roundMoney(Math.min(Math.max(0, coupon.value), subtotal));
  }
  return 0;
}

export function canReserveCoupon(usesCount: number, maxUses: number | null, activeReservations: number) {
  return maxUses === null || usesCount + activeReservations < maxUses;
}
