import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { ZONES, shippingFor } from '../utils/shipping';
import { METHODS, TRANSFER_NUMBER, INSTAPAY_ADDRESS, startCardPayment } from '../services/payments';
import { getClientProfile, getSavedAddresses } from '../utils/addresses';
import usePageTitle from '../utils/usePageTitle';

export default function Checkout() {
  usePageTitle('Checkout');
  const { cart, fmt, clearCart, addNewOrder, appliedPromo, removePromo } = useStore();
  const { user, loading, configured } = useAuth();
  const [zone, setZone] = useState(0);
  const [method, setMethod] = useState('cod');
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  // Default address and profile for guest/demo mode
  const clientProfile = getClientProfile();
  const savedAddrs = getSavedAddresses();
  const defaultAddr = savedAddrs.find(a => a.isDefault) || savedAddrs[0];

  if (loading && configured) return <main className="empty-state"><p>Loading…</p></main>;

  // If Firebase is configured and user is not logged in, redirect to login
  if (configured && (!user || user.isDemo)) {
    return <Navigate to="/account" state={{ from: 'checkout' }} replace />;
  }

  if (done) {
    const isInsta = done.method === 'instapay';
    const isVoda = done.method === 'vodafone' || done.method === 'wallet';
    const isCard = done.method === 'card';
    return (
      <main className="empty-state">
        <Check size={36} style={{ color: '#4d7c55', margin: '0 auto 16px' }} />
        <h3>تم تأكيد طلبك بنجاح · Order {done.id} Confirmed</h3>
        <p style={{ maxWidth: '580px', margin: '12px auto', lineHeight: 1.7 }}>
          {isInsta ? (
            <>
              يرجى تحويل <strong>{fmt(done.total)}</strong> عبر تطبيق <strong>InstaPay</strong> إلى المعرف (IPA): <code style={{ background: 'var(--soft)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{INSTAPAY_ADDRESS}</code> وكتابة كود الطلب <strong>{done.id}</strong> في خانة الملاحظات. سيتم بدء التجهيز والشحن فوراً.
            </>
          ) : isVoda ? (
            <>
              يرجى تحويل <strong>{fmt(done.total)}</strong> إلى محفظة فودافون كاش: <code style={{ background: 'var(--soft)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{TRANSFER_NUMBER}</code> ثم إرسال رسالة برقم الطلب <strong>{done.id}</strong>.
            </>
          ) : isCard ? (
            <>
              تم اعتماد الدفع الإلكتروني بنجاح بمبلغ <strong>{fmt(done.total)}</strong>. جاري تجهيز شحنتك الفاخرة وإصدار بوليصة التتبع.
            </>
          ) : (
            <>
              المبلغ المطلوب دفعه للمندوب عند الاستلام: <strong>{fmt(done.total)}</strong>. لديكِ <strong>معاينة مجانية كاملة</strong> للطرد قبل دفع أي مبلغ.
            </>
          )}
        </p>
        <p className="detail-note" style={{ justifyContent: 'center', marginTop: '16px' }}>
          تم حجز القطع وتحديث المخزون الفعلي في الأتيليه بنجاح.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
          <Link className="btn btn-dark" to="/account">متابعة طلباتي والتتبع · View my orders</Link>
          <Link className="btn btn-soft" to="/">العودة للرئيسية · Continue Shopping</Link>
        </div>
      </main>
    );
  }

  if (!cart.length) return <Navigate to="/cart" replace />;

  const subtotal = cart.reduce((a, p) => a + p.price * p.qty, 0);
  const shipping = shippingFor(subtotal, zone);

  let discountAmount = 0;
  if (appliedPromo && appliedPromo.valid) {
    if (appliedPromo.promo.type === 'percent') {
      discountAmount = (subtotal * appliedPromo.promo.value) / 100;
    } else {
      discountAmount = Math.min(subtotal, appliedPromo.promo.value);
    }
  }

  const total = Math.max(0, subtotal - discountAmount + shipping);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const f = new FormData(e.currentTarget);

    const order = {
      id: 'VEL-' + Date.now().toString(36).toUpperCase(),
      createdAt: Date.now(),
      method,
      total,
      subtotal,
      shipping,
      discount: discountAmount,
      promoCode: appliedPromo?.promo?.code || null,
      status: method === 'wallet' ? 'Awaiting payment' : 'Processing',
      customer: {
        name: f.get('name'),
        phone: f.get('phone'),
        email: f.get('email') || user?.email || clientProfile.email,
        address: f.get('address'),
        area: ZONES[zone].label,
      },
      items: cart.map(({ id, name, size, color, qty, price, image }) => ({
        id,
        name,
        size,
        color,
        qty,
        price,
        image,
      })),
      carrier: 'Aramex Premier Luxury',
      trackingNumber: `ARM-VEL-${Math.floor(100000 + Math.random() * 900000)}`,
      estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toLocaleDateString(),
    };

    try {
      if (method === 'card') await startCardPayment(order);
      await addNewOrder(user?.uid || 'demo-user-1', order);
      clearCart();
      if (removePromo) removePromo();
      setDone(order);
    } catch (err) {
      setBusy(false);
      setError(method === 'card' ? err.message : "We couldn't place your order. Please check your connection and try again.");
    }
  };

  const initialName = user?.displayName || clientProfile.name || '';
  const initialPhone = clientProfile.phone || '';
  const initialAddress = defaultAddr?.address || '';

  return (
    <main className="checkout-page">
      <form className="checkout-layout" onSubmit={submit}>
        <div className="contact-form">
          <span className="eyebrow">RESERVATION & DELIVERY</span>
          <h3>Delivery details</h3>

          <label>
            Full name
            <input name="name" required defaultValue={initialName} autoComplete="name" />
          </label>

          <label>
            Mobile number
            <input
              name="phone"
              type="tel"
              required
              defaultValue={initialPhone}
              pattern="01[0-9]{9}"
              title="Egyptian mobile, e.g. 01012345678"
              autoComplete="tel"
            />
          </label>

          <label>
            Email address
            <input
              name="email"
              type="email"
              required
              defaultValue={user?.email || clientProfile.email}
              autoComplete="email"
            />
          </label>

          <label>
            Area
            <select
              value={zone}
              onChange={e => setZone(Number(e.target.value))}
              className="plain-select"
            >
              {ZONES.map((z, i) => (
                <option key={z.label} value={i}>
                  {z.label} ({z.days})
                </option>
              ))}
            </select>
          </label>

          <label>
            Street Address & Apartment
            <textarea
              name="address"
              rows="3"
              required
              defaultValue={initialAddress}
              placeholder="Street name, building number, floor & apartment"
              autoComplete="street-address"
            />
          </label>

          <div className="pay-methods-head">
            <h3 className="pay-title" style={{ margin: 0 }}>طريقة الدفع المعتمدة · Payment Method</h3>
            <span className="pay-trust-shield">🔒 دفع آمن ومشفر 100% مع ميزة المعاينة قبل الاستلام</span>
          </div>
          
          <div className="pay-options-list" role="radiogroup" aria-label="طرق الدفع">
            {METHODS.map(m => (
              <label key={m.id} className={'pay-option ' + (method === m.id ? 'on' : '')}>
                <input
                  type="radio"
                  name="method"
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                />
                <span className="pay-option-content">
                  <span className="pay-option-top">
                    <b>{m.title}</b>
                    {m.badge && <span className="pay-badge">{m.badge}</span>}
                  </span>
                  <small>{m.desc}</small>
                  {method === m.id && m.account && (
                    <span className="pay-account-pill">
                      المعرف / الرقم: <code>{m.account}</code>
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>

        <aside className="order-summary">
          <h3>Your selection</h3>
          {cart.map(p => (
            <div key={p.key}>
              <span>
                {p.name}
                {p.color ? ` · ${p.color}` : ''}
                {p.size ? ` · ${p.size}` : ''} × {p.qty}
              </span>
              <strong>{fmt(p.price * p.qty)}</strong>
            </div>
          ))}

          <div><span>Subtotal</span><strong>{fmt(subtotal)}</strong></div>

          {discountAmount > 0 && (
            <div>
              <span>Coupon ({appliedPromo.promo.code})</span>
              <strong style={{ color: '#56835e' }}>-{fmt(discountAmount)}</strong>
            </div>
          )}

          <div><span>Delivery · {ZONES[zone].days}</span><strong>{shipping ? fmt(shipping) : 'Free'}</strong></div>

          <div className="summary-total">
            <span>Total</span>
            <strong>{fmt(total)}</strong>
          </div>

          <button className="btn btn-dark full-btn" type="submit" disabled={busy}>
            {busy ? 'Securing reservation…' : 'Place order & reserve inventory'}
          </button>

          <p className="secure-note">Inventory units are immediately allocated to this order</p>
        </aside>
      </form>
    </main>
  );
}
