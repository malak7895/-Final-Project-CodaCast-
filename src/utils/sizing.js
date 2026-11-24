// VELORA Fit Finder — sizing rules live here so they can be tuned in one place.
export const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function getSizeType(p) {
  const n = p.name.toLowerCase();
  if (/(sneaker|heel|loafer|shoe)/.test(n)) return 'shoes';
  if (/(bag|handbag|scarf|watch|belt|sunglasses|wallet)/.test(n)) return 'onesize';
  return 'clothes';
}

export function sizeOptions(p) {
  const type = getSizeType(p);
  if (type === 'onesize') return [];
  if (type === 'shoes') {
    const men = p.id.startsWith('men-') || /^men/i.test(p.category) || /loafer|running/i.test(p.name);
    const [from, to] = men ? [40, 46] : [36, 41];
    return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
  }
  return LETTER_SIZES;
}

// Weight bands (kg) are a starting point — adjust after you see real return data.
const BANDS = {
  women: [50, 58, 67, 77, 88],
  men: [60, 70, 80, 92, 105],
};

export function recommendClothes({ gender, height, weight, fit }) {
  const bands = BANDS[gender];
  let i = bands.findIndex(limit => weight < limit);
  if (i === -1) i = bands.length;
  const tall = gender === 'men' ? 188 : 175;
  const short = gender === 'men' ? 165 : 155;
  if (height > tall) i += 1;
  if (height < short) i -= 1;
  i += fit === 'snug' ? -1 : fit === 'loose' ? 1 : 0;
  return LETTER_SIZES[Math.min(Math.max(i, 0), LETTER_SIZES.length - 1)];
}

// Paris point: EU size = (foot length in cm + 1.5) x 1.5
export function recommendShoe(footCm) {
  return String(Math.round((footCm + 1.5) * 1.5));
}
