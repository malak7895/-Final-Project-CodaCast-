import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck, Tag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SectionHeading } from '../components/ProductCard';
import usePageTitle from '../utils/usePageTitle';
import { FREE_SHIPPING_AT, ZONES, shippingFor } from '../utils/shipping';

export default function Cart() {
  const { cart, change, remove, fmt, appliedPromo, applyPromo, removePromo } = useStore();
  usePageTitle('Shopping bag');
  const [zone, setZone] = useState(0);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const subtotal = cart.reduce((a, p) => a + p.price * p.qty, 0);
  const shipping = shippingFor(subtotal, zone);
  const remaining = Math.max(FREE_SHIPPING_AT - subtotal, 0);

  // Calculate discount if promo applied
  let discountAmount = 0;
  if (appliedPromo && appliedPromo.valid) {
    if (appliedPromo.promo.type === 'percent') {
      discountAmount = (subtotal * appliedPromo.promo.value) / 100;
    } else {
      discountAmount = Math.min(subtotal, appliedPromo.promo.value);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount + shipping);

  const handleApplyCode = (e) => {
    e.preventDefault();
    setPromoError('');
    if (!promoInput.trim()) return;
    const ok = applyPromo(promoInput.trim(), subtotal);
    if (!ok) {
      setPromoError('Invalid or inapplicable coupon code.');
    } else {
      setPromoInput('');
    }
  };

  return (
    <main className="cart-page">
      <SectionHeading eyebrow="YOUR SELECTION" title="Shopping bag" desc="The pieces you've chosen, gathered in one place." />
      {!cart.length ? (
        <div className="empty-state">
          <ShoppingBag size={32} />
          <h3>Your bag is waiting</h3>
          <p>Looks like you haven't found your favorites yet.</p>
          <Link className="btn btn-dark" to="/collection">Explore the collection</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map(p => (
              <article className="cart-item" key={p.key}>
                <Link to={`/product/${p.id}`}><img src={p.image} alt={p.name} /></Link>
                <div className="cart-item-info">
                  <span className="product-category">{p.category}{p.color ? ` · ${p.color}` : ''}{p.size ? ` · Size ${p.size}` : ''}</span>
                  <h3>{p.name}</h3>
                  <strong>{fmt(p.price)}</strong>
                  <div className="qty-control">
                    <button onClick={() => change(p.key, -1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                    <span>{p.qty}</span>
                    <button onClick={() => change(p.key, 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                  </div>
                </div>
                <button className="remove-btn" onClick={() => remove(p.key)} aria-label="Remove item"><Trash2 size={17} /></button>
              </article>
            ))}
          </div>

          <aside className="order-summary">
            <h3>Order summary</h3>
            <div className="ship-progress">
              <p>{remaining > 0 ? <>Add <b>{fmt(remaining)}</b> for free delivery</> : <>You've unlocked <b>free delivery</b></>}</p>
              <div className="bar"><i style={{ width: `${Math.min(subtotal / FREE_SHIPPING_AT, 1) * 100}%` }} /></div>
            </div>

            <label className="zone-select"><Truck size={15} /> Deliver to
              <select value={zone} onChange={e => setZone(Number(e.target.value))}>
                {ZONES.map((z, i) => <option key={z.label} value={i}>{z.label}</option>)}
              </select>
            </label>

            <div><span>Subtotal</span><strong>{fmt(subtotal)}</strong></div>

            {/* Promo Code Input */}
            <div className="cart-promo-section">
              {!appliedPromo ? (
                <form className="cart-promo-form" onSubmit={handleApplyCode}>
                  <label className="cart-promo-label">
                    <Tag size={13} />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. VELORA10)"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                    />
                  </label>
                  <button type="submit" className="text-btn">Apply</button>
                </form>
              ) : (
                <div className="applied-promo-pill">
                  <span>
                    <Tag size={13} /> Code <b>{appliedPromo.promo.code}</b> ({appliedPromo.promo.type === 'percent' ? `${appliedPromo.promo.value}%` : fmt(appliedPromo.promo.value)} off)
                  </span>
                  <button type="button" onClick={removePromo} title="Remove discount" className="icon-btn">
                    <X size={13} />
                  </button>
                </div>
              )}
              {promoError && <small className="form-error">{promoError}</small>}
            </div>

            {discountAmount > 0 && (
              <div className="summary-discount-row">
                <span>Discount ({appliedPromo.promo.code})</span>
                <strong className="discount-val">-{fmt(discountAmount)}</strong>
              </div>
            )}

            <div><span>Delivery · {ZONES[zone].days}</span><strong>{shipping ? fmt(shipping) : 'Free'}</strong></div>
            <div className="summary-total"><span>Total</span><strong>{fmt(finalTotal)}</strong></div>
            <Link className="btn btn-dark full-btn" to="/checkout">Continue to checkout <ArrowRight size={16} /></Link>
            <p className="secure-note">Cash on delivery, InstaPay and card options at checkout</p>
          </aside>
        </div>
      )}
    </main>
  );
}
