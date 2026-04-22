// SEO Score Calculator — used in admin product editor
export interface SeoScore {
  total: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  items: { label: string; passed: boolean; weight: number; tip?: string }[];
}

export function calculateProductSeoScore(product: {
  title?: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  images?: any[];
  price_cop?: number;
  publisher?: string;
  slug?: string;
}): SeoScore {
  const checks = [
    {
      label: 'Título tiene 40-60 caracteres',
      passed: !!product.meta_title && product.meta_title.length >= 40 && product.meta_title.length <= 60,
      weight: 15,
      tip: `Meta título actual: ${product.meta_title?.length || 0} chars. Ideal: 40-60.`,
    },
    {
      label: 'Meta description 120-160 caracteres',
      passed: !!product.meta_description && product.meta_description.length >= 120 && product.meta_description.length <= 160,
      weight: 15,
      tip: `Meta descripción: ${product.meta_description?.length || 0} chars. Ideal: 120-160.`,
    },
    {
      label: 'Descripción del producto (300+ palabras)',
      passed: !!product.description && product.description.split(/\s+/).length >= 80,
      weight: 20,
      tip: `Palabras actuales: ${product.description?.split(/\s+/).length || 0}. Mínimo: 80 palabras (~300 chars).`,
    },
    {
      label: 'Al menos 1 imagen',
      passed: (product.images?.length || 0) >= 1,
      weight: 10,
      tip: 'Agrega al menos una imagen del producto.',
    },
    {
      label: 'Mínimo 3 tags/keywords',
      passed: (product.tags?.length || 0) >= 3,
      weight: 10,
      tip: `Tags actuales: ${product.tags?.length || 0}. Mínimo recomendado: 3.`,
    },
    {
      label: 'Precio COP definido',
      passed: !!product.price_cop && product.price_cop > 0,
      weight: 10,
      tip: 'Define el precio en COP para mostrar en Google Shopping.',
    },
    {
      label: 'Editorial/Publisher definido',
      passed: !!product.publisher && product.publisher.length > 2,
      weight: 10,
      tip: 'La editorial ayuda al Schema markup de marca.',
    },
    {
      label: 'Slug URL limpio',
      passed: !!product.slug && /^[a-z0-9-]+$/.test(product.slug) && product.slug.length > 5,
      weight: 5,
      tip: 'El slug debe ser corto, descriptivo y solo con letras minúsculas y guiones.',
    },
    {
      label: 'Meta título contiene keyword principal',
      passed: !!product.meta_title && !!product.title && product.meta_title.toLowerCase().includes(product.title.toLowerCase().split(' ')[0]),
      weight: 5,
      tip: 'El meta título debe contener la palabra clave principal.',
    },
  ];

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter(c => c.passed).reduce((s, c) => s + c.weight, 0);
  const total = Math.round((earned / totalWeight) * 100);

  const grade = total >= 90 ? 'A' : total >= 75 ? 'B' : total >= 60 ? 'C' : total >= 40 ? 'D' : 'F';

  return { total, grade, items: checks };
}

export function getSeoColor(grade: string): string {
  return { A: '#16a34a', B: '#65a30d', C: '#d97706', D: '#ea580c', F: '#dc2626' }[grade] || '#9ca3af';
}
