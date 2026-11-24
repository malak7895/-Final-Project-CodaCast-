import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  UserRound,
  Heart,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ArrowRight,
  Sparkles,
  CreditCard,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { getCategoryTree, MEGA_MENU_GROUPS } from '../data/categories';
import { INSTAPAY_ADDRESS, TRANSFER_NUMBER } from '../services/payments';

export default function Header() {
  const { cart, wishlist, dark, setDark, currency, setCurrency } = useStore();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMega, setActiveMega] = useState(null); // 'Women' | 'Men' | 'Kids' | null
  const [mobileExpanded, setMobileExpanded] = useState({}); // { Women: true, ... }
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setActiveMega(null);
  }, [location.pathname, location.search]);

  // Handle outside clicks to close mega menu
  useEffect(() => {
    function handleClickOutside(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveMega(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const count = cart.reduce((a, b) => a + b.qty, 0);
  const categoryTree = getCategoryTree();
  const customDepts = Object.keys(categoryTree).filter(
    k => !['Women', 'Men', 'Kids'].includes(k)
  );

  const handleMouseEnter = dept => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMega(dept);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMega(null);
    }, 180);
  };

  const toggleMobileSub = dept => {
    setMobileExpanded(prev => ({
      ...prev,
      [dept]: !prev[dept],
    }));
  };

  const submitSearch = e => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate('/collection?search=' + encodeURIComponent(searchTerm.trim()));
    setSearchTerm('');
    setSearchOpen(false);
  };

  return (
    <header className="site-header" ref={headerRef}>
      {/* Top Utility Announcement Bar */}
      <div className="top-utility-bar">
        <div className="top-utility-inner">
          <div className="utility-badge">
            <Sparkles size={11} className="utility-icon" />
            <span>شحن فاخر مجاني فوق {currency === 'EGP' ? '2,500 ج.م' : '$150'} · معاينة مجانية للطرد قبل الدفع</span>
          </div>

          <div className="utility-center-ticker">
            <span className="ticker-badge">طرق الدفع:</span>
            <span>كاش عند الاستلام · انستاباي InstaPay · فودافون كاش · فيزا وميزة</span>
          </div>

          <div className="utility-right">
            <Link
              to="/admin"
              className="utility-link admin-top-link"
              title="لوحة تحكم الأتيليه والإدارة (Admin Dashboard)"
            >
              <LayoutDashboard size={11} />
              <span>لوحة الإدارة</span>
            </Link>
            <span className="utility-sep">·</span>
            <button
              type="button"
              className="utility-btn pay-info-trigger"
              onClick={() => setPaymentModalOpen(true)}
              aria-label="عرض طرق الدفع والضمان"
            >
              <CreditCard size={11} />
              <span>طرق الدفع</span>
            </button>
            <span className="utility-sep">·</span>
            <a
              href="https://wa.me/201012345678"
              target="_blank"
              rel="noopener noreferrer"
              className="utility-link whatsapp-link"
              title="تواصل مباشر مع كونسيرج ڤيلورا عبر واتساب"
            >
              واتساب: 01012345678
            </a>
            <span className="utility-sep">·</span>
            <button
              type="button"
              className="utility-btn"
              onClick={() => setCurrency(currency === 'EGP' ? 'USD' : 'EGP')}
              aria-label="Switch Currency"
            >
              <b>{currency}</b>
            </button>
            <span className="utility-sep">·</span>
            <button
              type="button"
              className="utility-btn theme-toggle-btn"
              onClick={() => setDark(!dark)}
              aria-label="Toggle Theme"
              title={dark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {dark ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="main-nav-bar">
        <div className="nav-container">
          {/* Left Column: Mobile Menu & Primary Fashion Departments */}
          <div className="nav-col nav-col-left">
            <button
              type="button"
              className="mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <nav className="desktop-primary-nav" aria-label="Main Navigation">
              {/* Home */}
              <div className="nav-item-wrapper">
                <NavLink
                  to="/"
                  className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
                  end
                  title="الصفحة الرئيسية"
                >
                  Home
                  <span className="nav-ar-tag">الرئيسية</span>
                </NavLink>
              </div>

              {/* WOMEN with Mega Menu */}
              <div
                className={`nav-item-wrapper ${activeMega === 'Women' ? 'mega-active' : ''}`}
                onMouseEnter={() => handleMouseEnter('Women')}
                onMouseLeave={handleMouseLeave}
              >
                <NavLink
                  to="/women"
                  className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
                >
                  Women
                  <ChevronDown size={11} className="nav-chevron" />
                </NavLink>

                {activeMega === 'Women' && (
                  <div className="mega-menu-panel" onMouseEnter={() => handleMouseEnter('Women')} onMouseLeave={handleMouseLeave}>
                    <div className="mega-menu-content">
                      <div className="mega-columns-grid">
                        {MEGA_MENU_GROUPS.Women.map((group, idx) => (
                          <div key={idx} className="mega-column">
                            <h4 className="mega-col-title">{group.heading}</h4>
                            <ul className="mega-link-list">
                              {group.items.map(sub => (
                                <li key={sub}>
                                  <NavLink
                                    to={`/women?sub=${encodeURIComponent(sub)}`}
                                    className="mega-sub-link"
                                    onClick={() => setActiveMega(null)}
                                  >
                                    {sub}
                                  </NavLink>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        {/* Editorial Featured Card */}
                        <div className="mega-feature-column">
                          <div className="mega-feature-card">
                            <div className="mega-feature-badge">THE ATELIER EDIT</div>
                            <h3>Timeless Women's Silhouette</h3>
                            <p>Curated evening gowns, silk dresses, soft tailoring, and leather accessories.</p>
                            <NavLink
                              to="/women"
                              className="mega-feature-cta"
                              onClick={() => setActiveMega(null)}
                            >
                              Explore All Women <ArrowRight size={13} />
                            </NavLink>
                          </div>
                        </div>
                      </div>

                      {/* Mega Menu Trust Strip */}
                      <div className="mega-menu-bottom-bar">
                        <div className="mega-trust-item">
                          <ShieldCheck size={14} className="mega-trust-icon" />
                          <span>معاينة مجانية كاملة للطرد قبل الدفع مع المندوب</span>
                        </div>
                        <div className="mega-trust-item">
                          <CreditCard size={14} className="mega-trust-icon" />
                          <span>طرق الدفع: كاش عند الاستلام · انستاباي · فودافون كاش · فيزا وميزة</span>
                        </div>
                        <div className="mega-trust-item">
                          <Sparkles size={14} className="mega-trust-icon" />
                          <span>أقمشة فاخرة أصلية 100% · استبدال واسترجاع خلال 14 يوماً</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MEN with Mega Menu */}
              <div
                className={`nav-item-wrapper ${activeMega === 'Men' ? 'mega-active' : ''}`}
                onMouseEnter={() => handleMouseEnter('Men')}
                onMouseLeave={handleMouseLeave}
              >
                <NavLink
                  to="/men"
                  className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
                >
                  Men
                  <ChevronDown size={11} className="nav-chevron" />
                </NavLink>

                {activeMega === 'Men' && (
                  <div className="mega-menu-panel" onMouseEnter={() => handleMouseEnter('Men')} onMouseLeave={handleMouseLeave}>
                    <div className="mega-menu-content">
                      <div className="mega-columns-grid">
                        {MEGA_MENU_GROUPS.Men.map((group, idx) => (
                          <div key={idx} className="mega-column">
                            <h4 className="mega-col-title">{group.heading}</h4>
                            <ul className="mega-link-list">
                              {group.items.map(sub => (
                                <li key={sub}>
                                  <NavLink
                                    to={`/men?sub=${encodeURIComponent(sub)}`}
                                    className="mega-sub-link"
                                    onClick={() => setActiveMega(null)}
                                  >
                                    {sub}
                                  </NavLink>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        <div className="mega-feature-column">
                          <div className="mega-feature-card">
                            <div className="mega-feature-badge">BESPOKE TAILORING</div>
                            <h3>Refined Modern Gentleman</h3>
                            <p>Sharp suits, luxury shirts, casual sneakers, and understated knitwear.</p>
                            <NavLink
                              to="/men"
                              className="mega-feature-cta"
                              onClick={() => setActiveMega(null)}
                            >
                              Explore All Men <ArrowRight size={13} />
                            </NavLink>
                          </div>
                        </div>
                      </div>

                      <div className="mega-menu-bottom-bar">
                        <div className="mega-trust-item">
                          <ShieldCheck size={14} className="mega-trust-icon" />
                          <span>معاينة مجانية للطلب قبل الدفع وتأكد من المقاس</span>
                        </div>
                        <div className="mega-trust-item">
                          <CreditCard size={14} className="mega-trust-icon" />
                          <span>انستاباي InstaPay · فودافون كاش · كاش عند الاستلام</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* KIDS with Mega Menu */}
              <div
                className={`nav-item-wrapper ${activeMega === 'Kids' ? 'mega-active' : ''}`}
                onMouseEnter={() => handleMouseEnter('Kids')}
                onMouseLeave={handleMouseLeave}
              >
                <NavLink
                  to="/kids"
                  className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
                >
                  Kids
                  <ChevronDown size={11} className="nav-chevron" />
                </NavLink>

                {activeMega === 'Kids' && (
                  <div className="mega-menu-panel" onMouseEnter={() => handleMouseEnter('Kids')} onMouseLeave={handleMouseLeave}>
                    <div className="mega-menu-content">
                      <div className="mega-columns-grid">
                        {MEGA_MENU_GROUPS.Kids.map((group, idx) => (
                          <div key={idx} className="mega-column">
                            <h4 className="mega-col-title">{group.heading}</h4>
                            <ul className="mega-link-list">
                              {group.items.map(sub => (
                                <li key={sub}>
                                  <NavLink
                                    to={`/kids?sub=${encodeURIComponent(sub)}`}
                                    className="mega-sub-link"
                                    onClick={() => setActiveMega(null)}
                                  >
                                    {sub}
                                  </NavLink>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        <div className="mega-feature-column">
                          <div className="mega-feature-card">
                            <div className="mega-feature-badge">PETITE ELEGANCE</div>
                            <h3>Little Luxuries</h3>
                            <p>Playful, soft organic cotton sets, dresses, and occasionwear.</p>
                            <NavLink
                              to="/kids"
                              className="mega-feature-cta"
                              onClick={() => setActiveMega(null)}
                            >
                              Explore All Kids <ArrowRight size={13} />
                            </NavLink>
                          </div>
                        </div>
                      </div>

                      <div className="mega-menu-bottom-bar">
                        <div className="mega-trust-item">
                          <ShieldCheck size={14} className="mega-trust-icon" />
                          <span>معاينة مجانية للمقاسات قبل الاستلام مع المندوب</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Quick Categories */}
              <div className="nav-item-wrapper">
                <NavLink
                  to="/women?sub=Dresses"
                  className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
                  title="تصفح جميع الفساتين"
                >
                  Dresses
                  <span className="nav-ar-tag">فساتين</span>
                </NavLink>
              </div>

              <div className="nav-item-wrapper">
                <NavLink
                  to="/women?sub=Bags"
                  className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
                  title="تصفح الشنط الفاخرة"
                >
                  Bags
                  <span className="nav-ar-tag">شنط</span>
                </NavLink>
              </div>

              <div className="nav-item-wrapper">
                <NavLink
                  to="/women?sub=Shoes"
                  className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
                  title="تصفح الأحذية والكوتشيات"
                >
                  Shoes
                  <span className="nav-ar-tag">أحذية</span>
                </NavLink>
              </div>

              {/* Custom Departments dynamically added by admin */}
              {customDepts.map(dept => (
                <div key={dept} className="nav-item-wrapper">
                  <NavLink
                    to={`/category/${dept.toLowerCase()}`}
                    className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
                  >
                    {dept}
                  </NavLink>
                </div>
              ))}
            </nav>
          </div>

          {/* Center Column: Prominent Luxury Brandmark */}
          <div className="nav-col nav-col-center">
            <Link to="/" className="luxury-brandmark" aria-label="VELORA Home">
              <span className="brand-title">
                VELORA<span className="brand-period">.</span>
              </span>
              <span className="brand-tagline">ATELIER & READY-TO-WEAR</span>
            </Link>
          </div>

          {/* Right Column: Secondary Navigation & Actions */}
          <div className="nav-col nav-col-right">
            <nav className="desktop-secondary-nav" aria-label="Secondary Collections">
              <NavLink to="/new-arrivals" className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}>
                New
              </NavLink>
              <NavLink to="/collection" className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}>
                Collection
              </NavLink>
              <NavLink to="/sale" className={({ isActive }) => `main-nav-link sale-nav-link ${isActive ? 'active' : ''}`}>
                Sale
              </NavLink>
            </nav>

            <div className="header-action-group">
              <button
                type="button"
                className="action-icon-btn"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search Catalog"
                title="Search"
              >
                <Search size={18} />
              </button>

              <NavLink
                to="/account"
                className={({ isActive }) => `action-icon-btn ${isActive ? 'active' : ''}`}
                aria-label="Client Account"
                title={user ? user.email : 'My Account'}
              >
                <UserRound size={18} />
                {user && <span className="auth-indicator-pip" />}
              </NavLink>

              <NavLink
                to="/admin"
                className={({ isActive }) => `action-icon-btn admin-action-btn ${isActive ? 'active' : ''}`}
                aria-label="Admin Dashboard"
                title="لوحة تحكم الإدارة (Admin Dashboard)"
              >
                <LayoutDashboard size={18} />
              </NavLink>

              {user && (
                <button
                  type="button"
                  className="action-icon-btn signout-btn"
                  onClick={async () => {
                    try {
                      await logout();
                      navigate('/account');
                    } catch (err) {
                      console.error('Sign out failed:', err);
                    }
                  }}
                  aria-label="Sign Out"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              )}

              <NavLink
                to="/wishlist"
                className={({ isActive }) => `action-icon-btn ${isActive ? 'active' : ''}`}
                aria-label="Saved Wishlist"
                title="Wishlist"
              >
                <Heart size={18} />
                {wishlist.length > 0 && <span className="badge-count">{wishlist.length}</span>}
              </NavLink>

              <NavLink
                to="/cart"
                className={({ isActive }) => `action-icon-btn bag-btn ${isActive ? 'active' : ''}`}
                aria-label="Shopping Bag"
                title="Shopping Bag"
              >
                <ShoppingBag size={18} />
                <span className="badge-count bag-count">{count}</span>
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* Egyptian Payment Methods Information Modal */}
      {paymentModalOpen && (
        <div className="velora-modal-overlay" onClick={() => setPaymentModalOpen(false)}>
          <div className="velora-modal-card" onClick={e => e.stopPropagation()}>
            <div className="velora-modal-header">
              <div>
                <span className="eyebrow">VELORA PAYMENT ASSURANCE</span>
                <h3>طرق الدفع المعتمدة وضمان المعاينة</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPaymentModalOpen(false)}
                aria-label="إغلاق النافذة"
              >
                <X size={20} />
              </button>
            </div>

            <div className="velora-modal-body">
              <div className="pay-modal-grid">
                <div className="pay-modal-card highlight">
                  <div className="pay-modal-badge">الأكثر أماناً وراحة</div>
                  <h4>🚚 الدفع عند الاستلام مع المعاينة المجانية الكاملة</h4>
                  <p>
                    لكِ كامل الحرية في فتح الطرد ومعاينة الفستان أو الشنطة أو الكوتشي والتأكد من المقاس وجودة الخامة والخياطة أمام مندوب التوصيل قبل دفع أي مليم. إذا لم ينل المنتج إعجابك، يمكنكِ رفض الاستلام بدون أي رسوم.
                  </p>
                </div>

                <div className="pay-modal-card">
                  <h4>⚡ شبكة المدفوعات اللحظية InstaPay (انستاباي)</h4>
                  <p>
                    دفع فوري ولحظي 24/7 بدون أي رسوم إضافية عبر تطبيق InstaPay مباشرة إلى المعرف البنكي الرسمي للأتيليه:
                  </p>
                  <div className="pay-modal-copy-box">
                    <span>المعرف (IPA): </span>
                    <code>{INSTAPAY_ADDRESS}</code>
                  </div>
                </div>

                <div className="pay-modal-card">
                  <h4>📱 فودافون كاش والمحافظ الإلكترونية</h4>
                  <p>
                    تحويل فوري من أي محفظة ذكية (فودافون كاش، أورنج كاش، اتصالات كاش، وي باي، ومحافظ البنوك) إلى رقم المحفظة:
                  </p>
                  <div className="pay-modal-copy-box">
                    <span>رقم المحفظة: </span>
                    <code>{TRANSFER_NUMBER}</code>
                  </div>
                </div>

                <div className="pay-modal-card">
                  <h4>💳 كروت ميزة وفيزا وماستركارد</h4>
                  <p>
                    دفع إلكتروني فوري ومشفر بأعلى معايير الحماية المصرفية وتشفير 3D Secure 2.0، يدعم كروت ميزة الوطنية، وكروت فيزا وماستركارد الدولية والمحلية.
                  </p>
                </div>
              </div>

              <div className="pay-modal-footer-note">
                <p>
                  💬 <strong>خدمة الكونسيرج:</strong> هل تودين الاستفسار عن تفاصيل مقاس أو خامة قبل الدفع؟ كونسيرج ڤيلورا متواجد لمساعدتك عبر واتساب على الرقم: <strong>01012345678</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Search Overlay */}
      {searchOpen && (
        <div className="header-search-overlay">
          <form className="search-form-inner" onSubmit={submitSearch}>
            <Search size={18} className="search-input-icon" />
            <input
              type="search"
              autoFocus
              placeholder="Search silk gowns, tailored blazers, leather bags..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-text-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
            <button type="submit" className="search-submit-btn">
              Search
            </button>
            <button
              type="button"
              className="search-close-btn"
              onClick={() => setSearchOpen(false)}
              aria-label="Close Search"
            >
              <X size={19} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="drawer-logo">VELORA<span>.</span></span>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-drawer-scroll">
              <div className="mobile-nav-list">
                {/* Home & Admin links */}
                <NavLink to="/" className="mobile-single-link home-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                  🏠 الرئيسية · Home
                </NavLink>
                <NavLink to="/admin" className="mobile-single-link admin-mobile-link" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  ⚙️ لوحة الإدارة · Admin Dashboard
                </NavLink>

                {/* Women Accordion */}
                <div className="mobile-dept-group">
                  <div className="mobile-dept-header">
                    <NavLink to="/women" className="mobile-dept-link" onClick={() => setMobileMenuOpen(false)}>
                      Women (النساء)
                    </NavLink>
                    <button
                      type="button"
                      className="mobile-expand-btn"
                      onClick={() => toggleMobileSub('Women')}
                      aria-label="Expand Women subcategories"
                    >
                      <ChevronDown size={16} className={`expand-chevron ${mobileExpanded.Women ? 'open' : ''}`} />
                    </button>
                  </div>

                  {mobileExpanded.Women && (
                    <div className="mobile-sub-list">
                      <NavLink to="/women" className="mobile-sub-item all-link" onClick={() => setMobileMenuOpen(false)}>
                        View All Women
                      </NavLink>
                      {(categoryTree.Women || []).map(sub => (
                        <NavLink
                          key={sub}
                          to={`/women?sub=${encodeURIComponent(sub)}`}
                          className="mobile-sub-item"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {sub}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>

                {/* Men Accordion */}
                <div className="mobile-dept-group">
                  <div className="mobile-dept-header">
                    <NavLink to="/men" className="mobile-dept-link" onClick={() => setMobileMenuOpen(false)}>
                      Men (الرجال)
                    </NavLink>
                    <button
                      type="button"
                      className="mobile-expand-btn"
                      onClick={() => toggleMobileSub('Men')}
                      aria-label="Expand Men subcategories"
                    >
                      <ChevronDown size={16} className={`expand-chevron ${mobileExpanded.Men ? 'open' : ''}`} />
                    </button>
                  </div>

                  {mobileExpanded.Men && (
                    <div className="mobile-sub-list">
                      <NavLink to="/men" className="mobile-sub-item all-link" onClick={() => setMobileMenuOpen(false)}>
                        View All Men
                      </NavLink>
                      {(categoryTree.Men || []).map(sub => (
                        <NavLink
                          key={sub}
                          to={`/men?sub=${encodeURIComponent(sub)}`}
                          className="mobile-sub-item"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {sub}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>

                {/* Kids Accordion */}
                <div className="mobile-dept-group">
                  <div className="mobile-dept-header">
                    <NavLink to="/kids" className="mobile-dept-link" onClick={() => setMobileMenuOpen(false)}>
                      Kids (الأطفال)
                    </NavLink>
                    <button
                      type="button"
                      className="mobile-expand-btn"
                      onClick={() => toggleMobileSub('Kids')}
                      aria-label="Expand Kids subcategories"
                    >
                      <ChevronDown size={16} className={`expand-chevron ${mobileExpanded.Kids ? 'open' : ''}`} />
                    </button>
                  </div>

                  {mobileExpanded.Kids && (
                    <div className="mobile-sub-list">
                      <NavLink to="/kids" className="mobile-sub-item all-link" onClick={() => setMobileMenuOpen(false)}>
                        View All Kids
                      </NavLink>
                      {(categoryTree.Kids || []).map(sub => (
                        <NavLink
                          key={sub}
                          to={`/kids?sub=${encodeURIComponent(sub)}`}
                          className="mobile-sub-item"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {sub}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Static Links */}
                <NavLink to="/women?sub=Dresses" className="mobile-single-link" onClick={() => setMobileMenuOpen(false)}>
                  Dresses (فساتين)
                </NavLink>
                <NavLink to="/women?sub=Bags" className="mobile-single-link" onClick={() => setMobileMenuOpen(false)}>
                  Bags (شنط فاخرة)
                </NavLink>
                <NavLink to="/women?sub=Shoes" className="mobile-single-link" onClick={() => setMobileMenuOpen(false)}>
                  Shoes (أحذية وكوتشيات)
                </NavLink>
                <NavLink to="/new-arrivals" className="mobile-single-link" onClick={() => setMobileMenuOpen(false)}>
                  New Arrivals
                </NavLink>
                <NavLink to="/collection" className="mobile-single-link" onClick={() => setMobileMenuOpen(false)}>
                  The Collection
                </NavLink>
                <NavLink to="/sale" className="mobile-single-link sale" onClick={() => setMobileMenuOpen(false)}>
                  Sale
                </NavLink>
                <button
                  type="button"
                  className="mobile-single-link"
                  style={{ background: 'transparent', border: 0, textAlign: 'left', width: '100%', cursor: 'pointer', color: 'var(--accent)' }}
                  onClick={() => { setMobileMenuOpen(false); setPaymentModalOpen(true); }}
                >
                  💳 طرق الدفع والضمان المعتمدة
                </button>
                <NavLink to="/contact" className="mobile-single-link" onClick={() => setMobileMenuOpen(false)}>
                  Client Concierge
                </NavLink>
              </div>

              {/* Mobile Drawer Footer Actions */}
              <div className="mobile-drawer-footer">
                <div className="mobile-action-row">
                  <NavLink to="/account" className="drawer-action-link" onClick={() => setMobileMenuOpen(false)}>
                    <UserRound size={16} /> {user ? 'My Profile' : 'Sign In / Account'}
                  </NavLink>
                  <NavLink to="/wishlist" className="drawer-action-link" onClick={() => setMobileMenuOpen(false)}>
                    <Heart size={16} /> Wishlist ({wishlist.length})
                  </NavLink>
                </div>
                {user && (
                  <button
                    type="button"
                    className="drawer-setting-pill"
                    style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={async () => {
                      try {
                        await logout();
                        setMobileMenuOpen(false);
                        navigate('/account');
                      } catch (err) {
                        console.error('Sign out failed:', err);
                      }
                    }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                )}

                <div className="mobile-settings-row">
                  <button
                    type="button"
                    className="drawer-setting-pill"
                    onClick={() => setCurrency(currency === 'EGP' ? 'USD' : 'EGP')}
                  >
                    Currency: <b>{currency}</b>
                  </button>
                  <button
                    type="button"
                    className="drawer-setting-pill"
                    onClick={() => setDark(!dark)}
                  >
                    {dark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
