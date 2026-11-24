import { USD_TO_EGP } from './format';

// Placeholder policy (EGP) — replace with your real rates.
export const FREE_SHIPPING_AT = 5000 / USD_TO_EGP;

export const ZONES = [
  { label: 'Cairo & Giza', fee: 80 / USD_TO_EGP, days: '1–2 business days' },
  { label: 'Alexandria & Delta', fee: 100 / USD_TO_EGP, days: '2–3 business days' },
  { label: 'Upper Egypt & Canal', fee: 120 / USD_TO_EGP, days: '3–5 business days' },
  { label: 'Other governorates', fee: 150 / USD_TO_EGP, days: '4–6 business days' },
];

export function shippingFor(subtotal, zoneIndex) {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_AT ? 0 : ZONES[zoneIndex].fee;
}
