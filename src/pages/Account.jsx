import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Heart,
  Settings,
  LogOut,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Eye,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth, friendlyError } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { getOrders, TRACKING_STAGES, getOrderTrackingStep } from '../utils/orders';
import {
  getClientProfile,
  updateClientProfile,
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultSavedAddress,
} from '../utils/addresses';
import usePageTitle from '../utils/usePageTitle';

export default function Account() {
  usePageTitle('My Account — VELORA');
  const { user, loading, configured, isDemo, login, signup, loginWithGoogle, resetPassword, enterDemoSession, logout } = useAuth();
  const { fmt, wishlist, products, add, toggleWish, currency, setCurrency, dark, setDark } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication mode for non-signed-in users
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [authMsg, setAuthMsg] = useState({ type: '', text: '' });
  const [authBusy, setAuthBusy] = useState(false);

  // Active dashboard tab
  const [tab, setTab] = useState('orders'); // 'orders' | 'tracking' | 'profile' | 'addresses' | 'wishlist' | 'settings' | 'order-detail'
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Data states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [profile, setProfile] = useState(getClientProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [addresses, setAddresses] = useState(getSavedAddresses);

  // Address modal / form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrForm, setAddrForm] = useState({
    label: '',
    recipientName: '',
    phone: '',
    area: 'Cairo & Giza',
    address: '',
    isDefault: false,
  });

  const activeUser = user;

  const handleLogout = async () => {
    try {
      await logout();
      setAuthMsg({ type: '', text: '' });
      setTab('orders');
      navigate('/account');
    } catch (err) {
      setAuthMsg({ type: 'error', text: friendlyError(err) });
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthMsg({ type: '', text: '' });
    setAuthBusy(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setAuthMsg({ type: 'error', text: friendlyError(err) });
    }
    setAuthBusy(false);
  };

  // Load orders for active user
  const activeUserId = activeUser?.uid;
  useEffect(() => {
    if (!activeUserId) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }
    let cancelled = false;
    setOrdersLoading(true);
    getOrders(activeUserId)
      .then(res => {
        if (cancelled) return;
        const list = res || [];
        setOrders(list);
        setSelectedOrderId(prev => prev || (list[0]?.id ?? null));
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeUserId]);

  if (loading && configured) {
    return <main className="empty-state"><p>Loading client portal…</p></main>;
  }

  // Handle Firebase Sign In / Up
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthMsg({ type: '', text: '' });
    setAuthBusy(true);
    const f = new FormData(e.currentTarget);
    const email = f.get('email')?.toString().trim();
    const password = f.get('password')?.toString();

    try {
      if (authMode === 'signin') {
        await login(email, password);
      } else if (authMode === 'signup') {
        if (password !== f.get('confirm')) {
          setAuthMsg({ type: 'error', text: 'Passwords do not match.' });
          setAuthBusy(false);
          return;
        }
        await signup(f.get('name').toString().trim(), email, password);
      } else if (authMode === 'forgot') {
        await resetPassword(email);
        setAuthMsg({
          type: 'ok',
          text: 'If an account exists, a reset link has been dispatched to your email.',
        });
      }
    } catch (err) {
      setAuthMsg({ type: 'error', text: friendlyError(err) });
    }
    setAuthBusy(false);
  };

  // If not logged in and not in demo session
  if (!activeUser) {
    return (
      <>
        <div className="page-banner">
          <span className="eyebrow">{authMode === 'signup' ? 'JOIN THE MAISON' : 'CLIENT PORTAL'}</span>
          <h1>{authMode === 'signup' ? 'Create your account' : 'Welcome to VELORA'}</h1>
          <p>
            {location.state?.from === 'checkout'
              ? 'Please authenticate to complete your reservation.'
              : 'Access your order history, real-time shipment tracking, and saved preferences.'}
          </p>
        </div>

        <main className="contact-layout">
          <div className="contact-details">
            <span className="eyebrow">THE VELORA EXPERIENCE</span>
            <h2>Timeless fashion,<br /><em>curated for you.</em></h2>
            <p>
              Your personal client portal provides dedicated access to order milestones,
              custom tailored preferences, and reserved atelier creations.
            </p>
            <div className="demo-login-box">
              <span className="eyebrow">PREVIEW MODE</span>
              <p>Explore the full customer dashboard with our demonstration client profile.</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={enterDemoSession}
              >
                Access Customer Dashboard as Sophia Laurent <ArrowRight size={14} />
              </button>
            </div>

            <div className="demo-login-box" style={{ marginTop: '16px', borderColor: 'var(--accent)' }}>
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>ADMINISTRATION PORTAL</span>
              <p>Looking for the store management panel to track inventory, products, categories, orders, and sales?</p>
              <Link to="/admin" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }}>
                Open Admin Dashboard (لوحة الإدارة) <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleAuthSubmit} key={authMode}>
            <h3>{authMode === 'signin' ? 'Sign in' : authMode === 'signup' ? 'Create Account' : 'Reset Password'}</h3>

            {authMsg.text && (
              <p className={authMsg.type === 'error' ? 'form-error' : 'form-success'}>
                {authMsg.text}
              </p>
            )}

            {!configured && (
              <p className="detail-note" style={{ margin: '10px 0 20px' }}>
                Running in local mode: create an account or sign in below (saved locally in your browser), or click the Demo Client button on the left.
              </p>
            )}

            {authMode === 'signup' && (
              <label>
                Full Name
                <input name="name" required autoComplete="name" />
              </label>
            )}

            <label>
              Email Address
              <input name="email" type="email" required autoComplete="email" />
            </label>

            {authMode !== 'forgot' && (
              <label>
                Password
                <input name="password" type="password" required autoComplete="current-password" />
              </label>
            )}

            {authMode === 'signup' && (
              <label>
                Confirm Password
                <input name="confirm" type="password" required autoComplete="new-password" />
              </label>
            )}

            <button type="submit" className="btn btn-dark full-btn" disabled={authBusy}>
              {authBusy ? 'Authenticating…' : authMode === 'signin' ? 'Sign In' : authMode === 'signup' ? 'Register' : 'Send Reset Link'}
            </button>

            {configured && authMode === 'signin' && (
              <button
                type="button"
                className="btn btn-outline full-btn"
                style={{ marginTop: '10px' }}
                onClick={handleGoogleSignIn}
                disabled={authBusy}
              >
                Continue with Google
              </button>
            )}

            <div className="auth-links">
              {authMode === 'signin' && (
                <>
                  <button type="button" className="text-btn" onClick={() => setAuthMode('signup')}>
                    Create an account
                  </button>
                  <button type="button" className="text-btn" onClick={() => setAuthMode('forgot')}>
                    Forgot password?
                  </button>
                </>
              )}
              {authMode !== 'signin' && (
                <button type="button" className="text-btn" onClick={() => setAuthMode('signin')}>
                  Return to sign in
                </button>
              )}
            </div>
          </form>
        </main>
      </>
    );
  }

  // Profile save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const updated = updateClientProfile({
      name: f.get('name'),
      phone: f.get('phone'),
      newsletter: f.get('newsletter') === 'on',
      smsAlerts: f.get('smsAlerts') === 'on',
    });
    setProfile(updated);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Address operations
  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (editingAddressId) {
      const updated = updateSavedAddress(editingAddressId, addrForm);
      setAddresses(updated);
    } else {
      const updated = addSavedAddress(addrForm);
      setAddresses(updated);
    }
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setAddrForm({
      label: '',
      recipientName: '',
      phone: '',
      area: 'Cairo & Giza',
      address: '',
      isDefault: false,
    });
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0] || null;

  // Wishlist products
  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="account-dashboard-page">
      {/* Banner */}
      <div className="account-hero-banner">
        <div className="account-hero-inner">
          <div className="account-user-meta">
            <span className="eyebrow">CLIENT PRIVILÈGE PORTAL</span>
            <h1>{isDemo ? profile.name : (activeUser.displayName || profile.name)}</h1>
            <p className="account-subtitle">
              {activeUser.email} · <span className="tier-badge">{profile.tier}</span> · Member since {profile.memberSince}
              {isDemo && (
                <span className="demo-badge" style={{ marginLeft: '10px', fontSize: '9px', padding: '2px 8px', background: 'var(--soft)', color: 'var(--muted)', borderRadius: '2px', border: '1px solid var(--line)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Demo Client
                </span>
              )}
            </p>
          </div>
          <div className="account-hero-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm-dash"
              onClick={handleLogout}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Account Navigation Strip */}
      <div className="account-nav-container">
        <div className="account-nav-bar">
          <button
            type="button"
            className={`account-nav-btn ${tab === 'orders' || tab === 'order-detail' ? 'active' : ''}`}
            onClick={() => setTab('orders')}
          >
            <Package size={15} /> My Orders ({orders.length})
          </button>
          <button
            type="button"
            className={`account-nav-btn ${tab === 'tracking' ? 'active' : ''}`}
            onClick={() => setTab('tracking')}
          >
            <Truck size={15} /> Order Tracking
          </button>
          <button
            type="button"
            className={`account-nav-btn ${tab === 'profile' ? 'active' : ''}`}
            onClick={() => setTab('profile')}
          >
            <User size={15} /> My Profile
          </button>
          <button
            type="button"
            className={`account-nav-btn ${tab === 'addresses' ? 'active' : ''}`}
            onClick={() => setTab('addresses')}
          >
            <MapPin size={15} /> Saved Addresses ({addresses.length})
          </button>
          <button
            type="button"
            className={`account-nav-btn ${tab === 'wishlist' ? 'active' : ''}`}
            onClick={() => setTab('wishlist')}
          >
            <Heart size={15} /> Wishlist ({wishlist.length})
          </button>
          <button
            type="button"
            className={`account-nav-btn ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => setTab('settings')}
          >
            <Settings size={15} /> Account Settings
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="account-main-content">
        {/* TAB 1: MY ORDERS */}
        {tab === 'orders' && (
          <section className="account-section">
            <div className="account-section-head">
              <div>
                <h2>My Orders</h2>
                <p>Track order fulfillment, download receipts, and view tailored piece records.</p>
              </div>
            </div>

            {ordersLoading && <p className="account-loading">Retrieving your orders…</p>}

            {!ordersLoading && orders.length === 0 && (
              <div className="empty-state">
                <Package size={36} />
                <h3>No Orders Yet</h3>
                <p>When you acquire a VELORA piece, your orders and tracking details will appear here.</p>
                <Link to="/collection" className="btn btn-dark">
                  Explore Collection
                </Link>
              </div>
            )}

            {!ordersLoading && orders.length > 0 && (
              <div className="orders-list-grid">
                {orders.map(order => (
                  <article key={order.id} className="order-summary-card">
                    <div className="order-card-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="order-id-label">{order.id}</span>
                          {order.isDemo && (
                            <span style={{ fontSize: '9px', padding: '1px 6px', background: 'var(--soft)', color: 'var(--muted)', borderRadius: '2px', border: '1px solid var(--line)', textTransform: 'uppercase' }}>
                              Demo
                            </span>
                          )}
                        </div>
                        <small className="order-date-label">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </small>
                      </div>
                      <span className={`order-status-pill status-${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="order-card-items-preview">
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="order-mini-item">
                          {it.image && <img src={it.image} alt={it.name} className="order-thumb" />}
                          <div className="order-mini-details">
                            <b>{it.name}</b>
                            <span>
                              {it.color ? `${it.color} · ` : ''}Size {it.size || 'One Size'} × {it.qty}
                            </span>
                            <strong>{fmt(it.price * it.qty)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <div className="order-total-block">
                        <span>Total Paid</span>
                        <strong>{fmt(order.total)}</strong>
                      </div>
                      <div className="order-actions-group">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm-dash"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setTab('order-detail');
                          }}
                        >
                          <Eye size={14} /> Order Details
                        </button>
                        <button
                          type="button"
                          className="btn btn-dark btn-sm-dash"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setTab('tracking');
                          }}
                        >
                          <Truck size={14} /> Track Order
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: ORDER DETAILS */}
        {tab === 'order-detail' && selectedOrder && (
          <section className="account-section">
            <div className="account-section-head">
              <div>
                <button
                  type="button"
                  className="text-btn back-btn"
                  onClick={() => setTab('orders')}
                >
                  ← Back to all orders
                </button>
                <h2>Order Details: {selectedOrder.id}</h2>
                <p>Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button
                type="button"
                className="btn btn-dark btn-sm-dash"
                onClick={() => setTab('tracking')}
              >
                <Truck size={14} /> Track this delivery
              </button>
            </div>

            <div className="order-detail-layout">
              <div className="order-items-table-wrap">
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Piece</th>
                      <th>Variant</th>
                      <th>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="item-piece-cell">
                          {it.image && <img src={it.image} alt={it.name} />}
                          <div>
                            <b>{it.name}</b>
                            <small>ID: {it.id}</small>
                          </div>
                        </td>
                        <td>
                          <span>{it.color || 'Standard'}</span> · <b>Size {it.size || 'One Size'}</b>
                        </td>
                        <td>{it.qty}</td>
                        <td style={{ textAlign: 'right' }}>{fmt(it.price)}</td>
                        <td style={{ textAlign: 'right' }}><b>{fmt(it.price * it.qty)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="order-meta-sidebar">
                <div className="meta-box">
                  <h3>Delivery Address</h3>
                  <p>
                    <b>{selectedOrder.customer?.name}</b><br />
                    {selectedOrder.customer?.address}<br />
                    {selectedOrder.customer?.area}<br />
                    Phone: {selectedOrder.customer?.phone}
                  </p>
                </div>

                <div className="meta-box">
                  <h3>Payment & Logistics</h3>
                  <div className="meta-row">
                    <span>Method</span>
                    <b>{selectedOrder.method === 'cod' ? 'Cash on Delivery' : selectedOrder.method === 'wallet' ? 'InstaPay / Wallet' : 'Credit / Debit Card'}</b>
                  </div>
                  <div className="meta-row">
                    <span>Carrier</span>
                    <b>{selectedOrder.carrier || 'VELORA White Glove'}</b>
                  </div>
                  <div className="meta-row">
                    <span>Waybill / Tracking</span>
                    <code>{selectedOrder.trackingNumber || 'VLR-TRACK-PENDING'}</code>
                  </div>
                </div>

                <div className="meta-box invoice-box">
                  <h3>Financial Summary</h3>
                  <div className="meta-row">
                    <span>Subtotal</span>
                    <strong>{fmt(selectedOrder.subtotal || selectedOrder.total)}</strong>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="meta-row discount-row">
                      <span>Promotional Discount</span>
                      <strong>-{fmt(selectedOrder.discount)}</strong>
                    </div>
                  )}
                  <div className="meta-row">
                    <span>Delivery Fee</span>
                    <strong>{selectedOrder.shipping ? fmt(selectedOrder.shipping) : 'Complimentary'}</strong>
                  </div>
                  <div className="meta-row total-row">
                    <span>Total Amount</span>
                    <b>{fmt(selectedOrder.total)}</b>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: ORDER TRACKING */}
        {tab === 'tracking' && (
          <section className="account-section">
            <div className="account-section-head">
              <div>
                <h2>Order Tracking & Milestone Progress</h2>
                <p>Real-time delivery progress verified with our carrier partners.</p>
              </div>

              {orders.length > 1 && (
                <div className="order-selector-wrap">
                  <label>Select Order: </label>
                  <select
                    value={selectedOrderId || ''}
                    onChange={e => setSelectedOrderId(e.target.value)}
                  >
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.id} ({o.status} · {fmt(o.total)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {!selectedOrder ? (
              <p>No active order selected for tracking.</p>
            ) : (
              <div className="tracking-display-container">
                <div className="tracking-header-card">
                  <div>
                    <span className="eyebrow">SHIPMENT CONSIGNMENT</span>
                    <h3>{selectedOrder.id}</h3>
                    <p>Carrier: <b>{selectedOrder.carrier || 'Aramex Premier Luxury'}</b> · Tracking ID: <code>{selectedOrder.trackingNumber || 'ARM-VEL-882901'}</code></p>
                  </div>
                  <div className="tracking-est-block">
                    <span className="eyebrow">ESTIMATED ARRIVAL</span>
                    <h4>{selectedOrder.estimatedDelivery || 'In 2–3 business days'}</h4>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="tracking-stepper">
                  {TRACKING_STAGES.map((stage, idx) => {
                    const currentStep = getOrderTrackingStep(selectedOrder.status);
                    const isDone = currentStep >= idx;
                    const isCurrent = currentStep === idx;

                    return (
                      <div
                        key={stage.key}
                        className={`step-item ${isDone ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                      >
                        <div className="step-marker">
                          {isDone ? <Check size={14} /> : <span>{idx + 1}</span>}
                        </div>
                        <div className="step-content">
                          <b>{stage.label}</b>
                          <small>{stage.desc}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tracking Details Card */}
                <div className="tracking-delivery-card">
                  <h4>Delivery Destination</h4>
                  <p>
                    {selectedOrder.customer?.name} · {selectedOrder.customer?.phone}<br />
                    {selectedOrder.customer?.address}, {selectedOrder.customer?.area}
                  </p>
                  <div className="tracking-secure-badge">
                    <ShieldCheck size={16} /> Signature required upon delivery.
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: MY PROFILE */}
        {tab === 'profile' && (
          <section className="account-section">
            <div className="account-section-head">
              <div>
                <h2>Personal Profile</h2>
                <p>Manage your client details, contact information, and atelier communication preferences.</p>
              </div>
            </div>

            <form key={activeUser.uid} className="account-profile-form" onSubmit={handleSaveProfile}>
              {profileSaved && (
                <div className="form-success" style={{ marginBottom: 20 }}>
                  <CheckCircle2 size={16} /> Profile changes updated successfully.
                </div>
              )}

              <div className="profile-form-grid">
                <label>
                  Full Name
                  <input name="name" defaultValue={profile.name} required />
                </label>

                <label>
                  Email Address
                  <input name="email" defaultValue={activeUser.email} disabled title="Email is linked to your authentication ID" />
                </label>

                <label>
                  Mobile Phone Number
                  <input name="phone" defaultValue={profile.phone} required pattern="01[0-9]{9}" />
                </label>

                <label>
                  Client Status Level
                  <input name="tier" defaultValue={profile.tier} disabled />
                </label>
              </div>

              <div className="profile-pref-toggles">
                <label className="checkbox-row">
                  <input type="checkbox" name="newsletter" defaultChecked={profile.newsletter} />
                  <span>Receive early access notifications for seasonal private sales and new collections</span>
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" name="smsAlerts" defaultChecked={profile.smsAlerts} />
                  <span>Receive instant SMS updates for order dispatch and courier deliveries</span>
                </label>
              </div>

              <button type="submit" className="btn btn-dark">
                Save Profile Changes
              </button>
            </form>
          </section>
        )}

        {/* TAB 5: SAVED ADDRESSES */}
        {tab === 'addresses' && (
          <section className="account-section">
            <div className="account-section-head">
              <div>
                <h2>Saved Delivery Addresses</h2>
                <p>Save multiple locations for fast, seamless checkout across residences and offices.</p>
              </div>
              <button
                type="button"
                className="btn btn-dark btn-sm-dash"
                onClick={() => {
                  setEditingAddressId(null);
                  setAddrForm({
                    label: '',
                    recipientName: profile.name,
                    phone: profile.phone,
                    area: 'Cairo & Giza',
                    address: '',
                    isDefault: false,
                  });
                  setIsAddingAddress(true);
                }}
              >
                <Plus size={14} /> Add New Address
              </button>
            </div>

            {isAddingAddress && (
              <form className="address-modal-form" onSubmit={handleSaveAddress}>
                <h3>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                <div className="profile-form-grid">
                  <label>
                    Address Label (e.g. Home, Office, Summer House)
                    <input
                      required
                      value={addrForm.label}
                      onChange={e => setAddrForm({ ...addrForm, label: e.target.value })}
                      placeholder="e.g. Zamalek Residence"
                    />
                  </label>
                  <label>
                    Recipient Name
                    <input
                      required
                      value={addrForm.recipientName}
                      onChange={e => setAddrForm({ ...addrForm, recipientName: e.target.value })}
                    />
                  </label>
                  <label>
                    Contact Mobile
                    <input
                      required
                      value={addrForm.phone}
                      onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })}
                    />
                  </label>
                  <label>
                    Governorate / Area
                    <select
                      value={addrForm.area}
                      onChange={e => setAddrForm({ ...addrForm, area: e.target.value })}
                      className="plain-select"
                    >
                      <option value="Cairo & Giza">Cairo & Giza</option>
                      <option value="Alexandria & Delta">Alexandria & Delta</option>
                      <option value="Upper Egypt & Canal">Upper Egypt & Canal</option>
                      <option value="Other governorates">Other governorates</option>
                    </select>
                  </label>
                </div>
                <label>
                  Detailed Street Address, Building, Floor & Apartment
                  <textarea
                    rows={2}
                    required
                    value={addrForm.address}
                    onChange={e => setAddrForm({ ...addrForm, address: e.target.value })}
                  />
                </label>
                <label className="checkbox-row" style={{ margin: '14px 0 20px' }}>
                  <input
                    type="checkbox"
                    checked={addrForm.isDefault}
                    onChange={e => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                  />
                  <span>Set as primary default delivery location</span>
                </label>
                <div className="addr-btn-row">
                  <button type="submit" className="btn btn-dark">
                    Save Address
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setIsAddingAddress(false);
                      setEditingAddressId(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="address-cards-grid">
              {addresses.map(addr => (
                <article key={addr.id} className={`address-card ${addr.isDefault ? 'is-default' : ''}`}>
                  <div className="address-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4>{addr.label}</h4>
                      {addr.isDemo && (
                        <span style={{ fontSize: '9px', padding: '1px 6px', background: 'var(--soft)', color: 'var(--muted)', borderRadius: '2px', border: '1px solid var(--line)', textTransform: 'uppercase' }}>
                          Demo
                        </span>
                      )}
                    </div>
                    {addr.isDefault ? (
                      <span className="default-addr-badge">Default Location</span>
                    ) : (
                      <button
                        type="button"
                        className="text-btn set-default-btn"
                        onClick={() => setAddresses(setDefaultSavedAddress(addr.id))}
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                  <p>
                    <b>{addr.recipientName}</b><br />
                    {addr.address}<br />
                    {addr.area}<br />
                    Phone: {addr.phone}
                  </p>
                  <div className="address-card-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Edit address"
                      onClick={() => {
                        setEditingAddressId(addr.id);
                        setAddrForm(addr);
                        setIsAddingAddress(true);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        className="icon-btn delete-icon"
                        title="Delete address"
                        onClick={() => {
                          if (window.confirm('Delete this address?')) {
                            setAddresses(deleteSavedAddress(addr.id));
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* TAB 6: WISHLIST */}
        {tab === 'wishlist' && (
          <section className="account-section">
            <div className="account-section-head">
              <div>
                <h2>My Wishlist ({wishlistProducts.length})</h2>
                <p>Pieces you have saved to acquire for your seasonal wardrobe.</p>
              </div>
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="empty-state">
                <Heart size={36} />
                <h3>Your wishlist is empty</h3>
                <p>Save pieces by clicking the heart icon while exploring the collection.</p>
                <Link to="/collection" className="btn btn-dark">
                  Explore Collection
                </Link>
              </div>
            ) : (
              <div className="wishlist-account-grid">
                {wishlistProducts.map(p => (
                  <article key={p.id} className="wishlist-account-card">
                    <Link to={`/product/${p.id}`} className="wishlist-thumb-link">
                      <img src={p.image} alt={p.name} />
                    </Link>
                    <div className="wishlist-card-details">
                      <span className="product-category">{p.category}</span>
                      <h3>{p.name}</h3>
                      <strong>{fmt(p.price)}</strong>
                      <div className="wishlist-card-actions">
                        <Link to={`/product/${p.id}`} className="btn btn-dark btn-sm-dash">
                          View & Select Size
                        </Link>
                        <button
                          type="button"
                          className="icon-btn remove-wish-icon"
                          onClick={() => toggleWish(p)}
                          title="Remove from wishlist"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 7: ACCOUNT SETTINGS */}
        {tab === 'settings' && (
          <section className="account-section">
            <div className="account-section-head">
              <div>
                <h2>Account Settings & Preferences</h2>
                <p>Fine-tune currency preferences, theme presentation, and data management.</p>
              </div>
            </div>

            <div className="settings-cards-list">
              <div className="settings-card">
                <div>
                  <h4>Currency Display</h4>
                  <p>Choose between Egyptian Pounds (EGP) and US Dollars (USD).</p>
                </div>
                <div className="seg">
                  <button
                    type="button"
                    className={currency === 'EGP' ? 'on' : ''}
                    onClick={() => setCurrency('EGP')}
                  >
                    EGP (ج.م)
                  </button>
                  <button
                    type="button"
                    className={currency === 'USD' ? 'on' : ''}
                    onClick={() => setCurrency('USD')}
                  >
                    USD ($)
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <div>
                  <h4>Aesthetic Theme Mode</h4>
                  <p>Select light or dark styling for your browsing experience.</p>
                </div>
                <div className="seg">
                  <button
                    type="button"
                    className={!dark ? 'on' : ''}
                    onClick={() => setDark(false)}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    className={dark ? 'on' : ''}
                    onClick={() => setDark(true)}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div className="settings-card notice-card">
                <div>
                  <h4>Technical Environment Disclosure</h4>
                  <p>
                    This is a front-end client demonstration running with local browser persistence (localStorage).
                    In enterprise production, authentication and shared multi-tenant inventory are powered by secure server-side infrastructure (Firebase Firestore / Cloud Functions / Node.js).
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
