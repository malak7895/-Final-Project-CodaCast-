import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Heart, ShoppingBag, Sparkles, Truck, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { sizeOptions } from '../utils/sizing';
import { FREE_SHIPPING_AT } from '../utils/shipping';
import usePageTitle from '../utils/usePageTitle';
import { ProductGrid, SectionHeading } from '../components/ProductCard';
import FitFinder from '../components/FitFinder';
import ProductGallery from '../components/ProductGallery';
import { resolveProductViews } from '../utils/productImages';

export default function ProductDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { products, add, toggleWish, wishlist, fmt, getProductTotalStock, getVariantStock } = useStore();
  const p = products.find(x => x.id === id);

  const [size, setSize] = useState('');
  const [warn, setWarn] = useState(false);

  // Color variants management
  const colorParam = searchParams.get('color');
  const { colors } = resolveProductViews(p, colorParam);
  const [activeColor, setActiveColor] = useState(null);

  useEffect(() => {
    if (p) {
      const { colors: currentColors } = resolveProductViews(p);
      if (currentColors.length > 0) {
        if (colorParam) {
          const match = currentColors.find(c => c.name.toLowerCase() === colorParam.toLowerCase());
          setActiveColor(match || currentColors[0]);
        } else {
          setActiveColor(currentColors[0]);
        }
      } else {
        setActiveColor(null);
      }
    }
    setSize('');
    setWarn(false);
  }, [p?.id, colorParam]);

  usePageTitle(p ? p.name : 'Not found');

  if (!p) {
    return (
      <div className="empty-state">
        <h2>Piece not found</h2>
        <Link to="/collection">Back to collection</Link>
      </div>
    );
  }

  const sizes = sizeOptions(p);
  const related = products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);

  // Stock calculations
  const totalStock = getProductTotalStock(p);
  const isStockNotSet = totalStock === null;
  const isOverallOutOfStock = totalStock !== null && totalStock === 0;

  // Variant stock for current selection
  const selectedVariantStock = size
    ? getVariantStock(p, activeColor?.name, size)
    : null;
  const isSelectedOutOfStock = selectedVariantStock !== null && selectedVariantStock === 0;

  const handleAdd = () => {
    if (isStockNotSet) {
      return;
    }
    if (sizes.length && !size) {
      setWarn(true);
      return;
    }
    if (isSelectedOutOfStock || isOverallOutOfStock) {
      return;
    }
    const { views } = resolveProductViews(p, activeColor?.name);
    add(p, size, activeColor?.name || '', views.front);
  };

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/collection">Collection</Link>
        <span>/</span>
        <b>{p.name}</b>
      </nav>

      <main className="detail-wrap">
        {/* Advanced 4-View Gallery */}
        <ProductGallery
          product={p}
          activeColor={activeColor}
          onColorChange={setActiveColor}
        />

        <div className="detail-info" key={p.id}>
          <div className="detail-header-meta">
            <span className="eyebrow">{p.category}</span>
            {totalStock !== null && (
              <span className={`stock-pill ${isOverallOutOfStock ? 'pill-out' : totalStock <= 10 ? 'pill-low' : 'pill-ok'}`}>
                {isOverallOutOfStock
                  ? 'Out of Stock'
                  : totalStock <= 10
                  ? `Low Stock · ${totalStock} available`
                  : `${totalStock} units available`}
              </span>
            )}
            {totalStock === null && (
              <span className="stock-pill pill-notset">Stock Not Set</span>
            )}
          </div>

          <h1>{p.name}</h1>
          <div className="detail-price">{fmt(p.price)}</div>
          <p>{p.description} Designed to bring a considered finish to your wardrobe, season after season.</p>

          {/* Color Variant Selector */}
          {colors.length > 0 && (
            <div className="color-block">
              <div className="color-head">
                <span>Color</span>
                <b>{activeColor?.name || colors[0]?.name}</b>
              </div>
              <div className="color-grid" role="radiogroup" aria-label="Color options">
                {colors.map(c => {
                  const isSelected = (activeColor?.name || colors[0]?.name) === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      className={`color-chip ${isSelected ? 'on' : ''}`}
                      onClick={() => setActiveColor(c)}
                      aria-label={c.name}
                      aria-checked={isSelected}
                      role="radio"
                      title={c.name}
                    >
                      <span className="color-swatch-circle" style={{ backgroundColor: c.hex }} />
                      <span className="color-chip-label">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector with real stock tracking */}
          {sizes.length > 0 && (
            <div className="size-block">
              <div className="size-head">
                <span>Size</span>
                {warn && !size && <em role="alert">Please choose a size</em>}
              </div>
              <div className="size-grid">
                {sizes.map(s => {
                  const vStock = getVariantStock(p, activeColor?.name, s);
                  const isSoldOut = vStock !== null && vStock === 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isSoldOut}
                      className={
                        'size-chip ' +
                        (size === s ? 'on ' : '') +
                        (isSoldOut ? 'sold-out ' : '')
                      }
                      onClick={() => {
                        if (!isSoldOut) {
                          setSize(s);
                          setWarn(false);
                        }
                      }}
                      aria-pressed={size === s}
                      title={
                        vStock !== null
                          ? `${vStock} pieces in stock`
                          : 'Stock not configured'
                      }
                    >
                      <span className="size-label-text">{s}</span>
                      {vStock !== null && (
                        <span className={`size-chip-stock ${vStock === 0 ? 'zero' : vStock <= 3 ? 'low' : ''}`}>
                          {vStock === 0 ? 'Sold' : `${vStock} left`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <FitFinder product={p} onPick={s => { setSize(s); setWarn(false); }} />
            </div>
          )}

          {/* Dynamic Stock Indicator for selected variant */}
          <div className="variant-stock-callout">
            {isStockNotSet ? (
              <div className="stock-alert alert-neutral">
                <AlertTriangle size={15} />
                <span><strong>Stock Not Set:</strong> Inventory for this piece has not yet been configured. Purchases are currently disabled.</span>
              </div>
            ) : size ? (
              selectedVariantStock !== null ? (
                selectedVariantStock === 0 ? (
                  <div className="stock-alert alert-out">
                    <XCircle size={15} />
                    <span><strong>Out of Stock:</strong> {activeColor?.name || 'Selected variant'} in size {size} is currently sold out.</span>
                  </div>
                ) : selectedVariantStock <= 5 ? (
                  <div className="stock-alert alert-low">
                    <AlertTriangle size={15} />
                    <span><strong>Only {selectedVariantStock} pieces remaining:</strong> Order now to secure {activeColor?.name || ''} in size {size}.</span>
                  </div>
                ) : (
                  <div className="stock-alert alert-ok">
                    <CheckCircle2 size={15} />
                    <span><strong>In Stock:</strong> {selectedVariantStock} pieces available in {activeColor?.name || ''} / Size {size}.</span>
                  </div>
                )
              ) : (
                <div className="stock-alert alert-neutral">
                  <span>Stock for this variant has not been configured in the inventory system.</span>
                </div>
              )
            ) : (
              <div className="stock-hint">
                <span>Select your size to view real-time atelier stock.</span>
              </div>
            )}
          </div>

          <div className="detail-note">
            <Sparkles size={17} /> A VELORA considered essential
          </div>

          <button
            className={`btn btn-dark full-btn ${isSelectedOutOfStock || isOverallOutOfStock || isStockNotSet ? 'btn-disabled-stock' : ''}`}
            onClick={handleAdd}
            disabled={isSelectedOutOfStock || isOverallOutOfStock || isStockNotSet}
          >
            {isStockNotSet
              ? 'Unavailable · Stock Not Set'
              : isOverallOutOfStock
              ? 'Completely Out of Stock'
              : isSelectedOutOfStock
              ? 'Out of Stock in This Size'
              : 'Add to bag'}{' '}
            <ShoppingBag size={17} />
          </button>

          <p className="ship-hint">
            <Truck size={14} /> Free delivery on orders over {fmt(FREE_SHIPPING_AT)}
          </p>

          <button className="underlink wish-detail" onClick={() => toggleWish(p)}>
            <Heart size={17} fill={wishlist.includes(p.id) ? 'currentColor' : 'none'} />
            {wishlist.includes(p.id) ? 'Saved to wishlist' : 'Add to wishlist'}
          </button>

          {/* Egyptian Luxury Payment & Guarantee Trust Box */}
          <div className="velora-payment-trust-box">
            <div className="trust-box-title">
              <ShieldCheck size={16} className="trust-shield-icon" />
              <span>ضمان ڤيلورا وطرق الدفع المعتمدة</span>
            </div>
            <div className="trust-feature-list">
              <div className="trust-item">
                <span className="trust-check">✓</span>
                <div>
                  <strong>معاينة مجانية عند الاستلام:</strong>
                  <p>افحصي المنتج بالكامل وتأكدي من المقاس والخامة قبل دفع أي مبلغ للمندوب.</p>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-check">✓</span>
                <div>
                  <strong>طرق دفع متعددة ولحظية:</strong>
                  <p>كاش عند الاستلام · انستاباي InstaPay · فودافون كاش ومحافظ المحمول · فيزا وميزة.</p>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-check">✓</span>
                <div>
                  <strong>استبدال واسترجاع سهل:</strong>
                  <p>استبدال مجاني خلال 14 يوماً مع مندوب لحد باب بيتك.</p>
                </div>
              </div>
            </div>
            <div className="trust-payment-badges">
              <span className="pay-badge-chip">InstaPay انستاباي</span>
              <span className="pay-badge-chip">Vodafone Cash فودافون كاش</span>
              <span className="pay-badge-chip">كارت ميزة Meeza</span>
              <span className="pay-badge-chip">Visa / Mastercard</span>
              <span className="pay-badge-chip">الدفع عند الاستلام</span>
            </div>
          </div>

          <div className="detail-accordions">
            <details open>
              <summary>Product details & multi-variant specification</summary>
              <p>Thoughtfully tailored silhouette. Includes real-time stock allocation tracked across colors and sizing tiers. Exact dye tint and fabric texture may vary subtly by screen rendition.</p>
            </details>
            <details>
              <summary>Delivery & inventory policy</summary>
              <p>Orders are reserved from physical inventory upon checkout completion. Orders cannot exceed verified stock quantities.</p>
            </details>
          </div>
        </div>
      </main>

      {related.length > 0 && (
        <section className="section-wrap related">
          <SectionHeading eyebrow="COMPLETE THE LOOK" title="You may also like" />
          <ProductGrid items={related} />
        </section>
      )}
    </>
  );
}
