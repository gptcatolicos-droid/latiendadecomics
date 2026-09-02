export type IntelligenceSnapshot = {
  revenue30d: number;
  revenuePrevious30d: number;
  paidOrders30d: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  abandonedCarts: number;
  recoverableUsd: number;
  campaignsWithoutConversions: number;
  inefficientSpendMinor: number;
  marketplaceAttention: number;
  hasProductCosts: boolean;
  sessions30d: number;
};

export type GeneratedInsight = {
  fingerprint: string;
  type: 'sales' | 'inventory' | 'marketing' | 'abandoned_cart' | 'marketplace' | 'profit' | 'data_quality';
  severity: 'info' | 'opportunity' | 'warning' | 'critical';
  title: string;
  summary: string;
  recommendation: string;
  evidence: Record<string, number | string | boolean>;
  confidence: number;
};

export function percentChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}

export function generateInsights(snapshot: IntelligenceSnapshot): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];
  const revenueChange = percentChange(snapshot.revenue30d, snapshot.revenuePrevious30d);
  if (revenueChange !== null && revenueChange <= -15) {
    insights.push({
      fingerprint: 'sales-revenue-decline-30d', type: 'sales', severity: 'warning',
      title: 'Las ventas bajaron frente al periodo anterior',
      summary: `Los ingresos pagados de los últimos 30 días variaron ${revenueChange.toFixed(1)}%.`,
      recommendation: 'Revisar productos, canales y campañas antes de cambiar precios o presupuesto.',
      evidence: { revenue30d: snapshot.revenue30d, revenuePrevious30d: snapshot.revenuePrevious30d, changePercent: revenueChange }, confidence: 0.98,
    });
  } else if (revenueChange !== null && revenueChange >= 15) {
    insights.push({
      fingerprint: 'sales-revenue-growth-30d', type: 'sales', severity: 'opportunity',
      title: 'El crecimiento de ventas merece seguimiento',
      summary: `Los ingresos pagados aumentaron ${revenueChange.toFixed(1)}% contra los 30 días previos.`,
      recommendation: 'Identificar los productos y fuentes que explican el crecimiento antes de escalar.',
      evidence: { revenue30d: snapshot.revenue30d, revenuePrevious30d: snapshot.revenuePrevious30d, changePercent: revenueChange }, confidence: 0.98,
    });
  }
  if (snapshot.outOfStockProducts > 0 || snapshot.lowStockProducts > 0) {
    insights.push({
      fingerprint: 'inventory-stock-attention', type: 'inventory', severity: snapshot.outOfStockProducts > 0 ? 'critical' : 'warning',
      title: 'Hay productos publicados con inventario crítico',
      summary: `${snapshot.outOfStockProducts} agotados y ${snapshot.lowStockProducts} con menos de 5 unidades.`,
      recommendation: 'Revisar demanda y lead time; aprobar reposición solo después de validar el proveedor.',
      evidence: { outOfStockProducts: snapshot.outOfStockProducts, lowStockProducts: snapshot.lowStockProducts }, confidence: 1,
    });
  }
  if (snapshot.abandonedCarts > 0) {
    insights.push({
      fingerprint: 'abandoned-cart-opportunity', type: 'abandoned_cart', severity: 'opportunity',
      title: 'Existe una oportunidad de recuperación consentida',
      summary: `${snapshot.abandonedCarts} carritos abandonados suman USD ${snapshot.recoverableUsd.toFixed(2)}.`,
      recommendation: 'Revisar los borradores de recuperación y aprobar únicamente mensajes pertinentes.',
      evidence: { abandonedCarts: snapshot.abandonedCarts, recoverableUsd: snapshot.recoverableUsd }, confidence: 1,
    });
  }
  if (snapshot.campaignsWithoutConversions > 0) {
    insights.push({
      fingerprint: 'marketing-spend-no-conversions', type: 'marketing', severity: 'warning',
      title: 'Hay inversión publicitaria sin conversiones registradas',
      summary: `${snapshot.campaignsWithoutConversions} campañas reportan gasto y cero conversiones.`,
      recommendation: 'Validar primero la medición; luego revisar segmentación, creatividad y landing page. No pausar automáticamente.',
      evidence: { campaigns: snapshot.campaignsWithoutConversions, spendMinor: snapshot.inefficientSpendMinor }, confidence: 0.9,
    });
  }
  if (snapshot.marketplaceAttention > 0) {
    insights.push({
      fingerprint: 'marketplace-listings-attention', type: 'marketplace', severity: 'critical',
      title: 'Amazon reporta listings que requieren atención',
      summary: `${snapshot.marketplaceAttention} listings tienen problemas de stock, precio, sincronización o supresión.`,
      recommendation: 'Abrir Marketplaces y resolver las incidencias antes de reenviar cambios.',
      evidence: { listings: snapshot.marketplaceAttention }, confidence: 1,
    });
  }
  if (!snapshot.hasProductCosts) {
    insights.push({
      fingerprint: 'data-quality-product-costs-missing', type: 'data_quality', severity: 'info',
      title: 'El beneficio de contribución aún no es calculable',
      summary: 'El catálogo no tiene un costo normalizado para todos los productos.',
      recommendation: 'Completar costos antes de usar margen o beneficio para decisiones automáticas.',
      evidence: { hasProductCosts: false }, confidence: 1,
    });
  }
  if (snapshot.sessions30d === 0) {
    insights.push({
      fingerprint: 'data-quality-sessions-missing', type: 'data_quality', severity: 'info',
      title: 'La tasa de conversión no está disponible',
      summary: 'No existen eventos de sesión suficientes para calcular compras sobre sesiones.',
      recommendation: 'Completar la instrumentación analítica antes de comparar conversión.',
      evidence: { sessions30d: 0 }, confidence: 1,
    });
  }
  return insights;
}
