// Prices in products.js are stored in USD; change the rate to match your pricing.
export const USD_TO_EGP = 50;

export function formatMoney(usd, currency = 'EGP') {
  const n = Number(usd);
  return currency === 'USD'
    ? `$${n.toFixed(2)}`
    : `EGP ${Math.round(n * USD_TO_EGP).toLocaleString('en-US')}`;
}
