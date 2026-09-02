export type PricingStrategy = 'fixed_margin' | 'multiplier' | 'fixed_profit';
export type PricingRounding = 'none' | 'ninety_nine' | 'whole';

export interface PricingRule {
  strategy: PricingStrategy;
  value: number;
  minimumMarginPercent: number;
  rounding: PricingRounding;
}

export function calculateSupplierRetail(costMinor: number, rule: PricingRule) {
  const safeCost = Math.max(0, Math.round(costMinor));
  let calculated = safeCost;

  if (rule.strategy === 'multiplier') calculated = safeCost * rule.value;
  if (rule.strategy === 'fixed_profit') calculated = safeCost + Math.round(rule.value * 100);
  if (rule.strategy === 'fixed_margin') {
    const margin = Math.min(95, Math.max(0, rule.value));
    calculated = safeCost / (1 - margin / 100);
  }

  const minimum = safeCost / (1 - Math.min(95, Math.max(0, rule.minimumMarginPercent)) / 100);
  let result = Math.max(calculated, minimum);

  if (rule.rounding === 'whole') result = Math.ceil(result / 100) * 100;
  if (rule.rounding === 'ninety_nine') result = Math.max(99, Math.ceil((result + 1) / 100) * 100 - 1);

  return Math.round(result);
}
