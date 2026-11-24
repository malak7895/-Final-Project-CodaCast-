// VELORA Promotions & Discount Engine
// Manages coupon codes, percentages, fixed amounts, and minimum spend rules.

const PROMO_STORAGE_KEY = 'velora-promotions-v1';

export const DEFAULT_PROMOTIONS = [
  {
    code: 'VELORA10',
    type: 'percent', // 'percent' | 'fixed'
    value: 10,
    minSpend: 0,
    active: true,
    description: '10% off your entire seasonal order',
    usageCount: 42,
    isDemo: true,
  },
  {
    code: 'WELCOME20',
    type: 'percent',
    value: 20,
    minSpend: 50, // in USD base
    active: true,
    description: '20% off for newly welcomed clients (min $50 / 2,500 EGP)',
    usageCount: 18,
    isDemo: true,
  },
  {
    code: 'LUXURY50',
    type: 'fixed',
    value: 15, // in USD base
    minSpend: 75,
    active: true,
    description: '$15 / 750 EGP gift on orders over $75 / 3,750 EGP',
    usageCount: 29,
    isDemo: true,
  },
];

export function getPromotions() {
  if (typeof window === 'undefined') return DEFAULT_PROMOTIONS;
  try {
    const raw = localStorage.getItem(PROMO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(DEFAULT_PROMOTIONS));
      return DEFAULT_PROMOTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PROMOTIONS;
  } catch {
    return DEFAULT_PROMOTIONS;
  }
}

export function savePromotions(promotions) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promotions));
  } catch (err) {
    console.error('Failed to save promotions:', err);
  }
}

export function addPromotion(newPromo) {
  const list = getPromotions();
  const cleanCode = newPromo.code.trim().toUpperCase();
  const existingIdx = list.findIndex(p => p.code.toUpperCase() === cleanCode);

  const promoRecord = {
    code: cleanCode,
    type: newPromo.type || 'percent',
    value: Number(newPromo.value) || 10,
    minSpend: Number(newPromo.minSpend) || 0,
    active: newPromo.active !== false,
    description: newPromo.description || `${newPromo.value}% off`,
    usageCount: 0,
  };

  let updated;
  if (existingIdx !== -1) {
    updated = list.map((p, i) => (i === existingIdx ? promoRecord : p));
  } else {
    updated = [promoRecord, ...list];
  }
  savePromotions(updated);
  return updated;
}

export function togglePromotion(code) {
  const list = getPromotions();
  const updated = list.map(p =>
    p.code.toUpperCase() === code.toUpperCase() ? { ...p, active: !p.active } : p
  );
  savePromotions(updated);
  return updated;
}

export function deletePromotion(code) {
  const list = getPromotions();
  const updated = list.filter(p => p.code.toUpperCase() !== code.toUpperCase());
  savePromotions(updated);
  return updated;
}

export function resetPromotions() {
  savePromotions(DEFAULT_PROMOTIONS);
  return DEFAULT_PROMOTIONS;
}

export function validatePromotion(code, subtotal) {
  if (!code || !code.trim()) {
    return { valid: false, message: 'Please enter a promotion code.' };
  }
  const cleanCode = code.trim().toUpperCase();
  const list = getPromotions();
  const promo = list.find(p => p.code.toUpperCase() === cleanCode);

  if (!promo) {
    return { valid: false, message: 'Invalid promotion code.' };
  }

  if (!promo.active) {
    return { valid: false, message: 'This promotion code is currently inactive.' };
  }

  if (promo.minSpend && subtotal < promo.minSpend) {
    return {
      valid: false,
      message: `Minimum order spend of $${promo.minSpend} required to apply ${promo.code}.`,
    };
  }

  let discountAmount = 0;
  if (promo.type === 'percent') {
    discountAmount = (subtotal * promo.value) / 100;
  } else {
    discountAmount = Math.min(subtotal, promo.value);
  }

  return {
    valid: true,
    promo,
    discountAmount: Math.round(discountAmount * 100) / 100,
    message: `${promo.code} applied successfully!`,
  };
}
