import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import { sizeOptions } from '../utils/sizing';
import { useStore } from '../context/StoreContext';
import { resolveProductViews, getProductFallback } from '../utils/productImages';

export function ProductCard({ p }) {
  const { add, wishlist, toggleWish, fmt, getProductTotalStock } = useStore();
  const navigate = useNavigate();
  const saved = wishlist.includes(p.id);
  const needsSize = sizeOptions(p).length > 0;
  const fallback = getProductFallback(p);

  // Resolve views and color variants
  const { colors } = resolveProductViews(p);
  const [selectedColor, setSelectedColor] = useState(colors[0] || null);

  const { views } = resolveProductViews(p, selectedColor?.name);
  const primaryImage = views.front || p.image || fallback;
  const hoverImage = views.back || views.side || views.detail || null;

  // Stock calculations
  const totalStock = getProductTotalStock(p);
  const isStockNotSet = totalStock === null;
  const isOutOfStock = totalStock !== null && totalStock === 0;
  const isLowStock = totalStock !== null && totalStock > 0 && totalStock <= 5;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isStockNotSet) return;

    if (needsSize) {
      navigate(`/product/${p.id}${selectedColor ? `?color=${encodeURIComponent(selectedColor.name)}` : ''}`);
    } else {
      add(p, '', selectedColor?.name || '', primaryImage);
    }
  };

  return (
    <article className={`product-card ${isOutOfStock ? 'card-out-of-stock' : ''} ${isStockNotSet ? 'card-stock-not-set' : ''}`}>
      <div className="product-image">
        <Link to={`/product/${p.id}${selectedColor ? `?color=${encodeURIComponent(selectedColor.name)}` : ''}`} className="product-image-link">
          <img
            src={primaryImage}
            alt={p.name}
            loading="lazy"
            className="product-img primary"
            onError={e => { e.currentTarget.src = fallback; }}
          />
          {hoverImage && hoverImage !== primaryImage && (
            <img
              src={hoverImage}
              alt={`${p.name} - Back view preview`}
              loading="lazy"
              className="product-img hover-preview"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </Link>

        {isStockNotSet ? (
          <span className="product-badge badge-notset">Stock Not Set</span>
        ) : isOutOfStock ? (
          <span className="product-badge badge-out">Out of Stock</span>
        ) : isLowStock ? (
          <span className="product-badge badge-low">Only {totalStock} left</span>
        ) : p.badge ? (
          <span className="product-badge">{p.badge}</span>
        ) : null}

        <button
          type="button"
          className={'wish-btn ' + (saved ? 'saved' : '')}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(p); }}
          aria-label="Toggle wishlist"
        >
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          className={`quick-add ${isOutOfStock || isStockNotSet ? 'quick-add-disabled' : ''}`}
          onClick={handleQuickAdd}
          disabled={isOutOfStock || isStockNotSet}
        >
          {isStockNotSet
            ? 'Stock Not Set'
            : isOutOfStock
            ? 'Out of Stock'
            : needsSize
            ? 'Choose size'
            : 'Add to bag'}{' '}
          {!isOutOfStock && !isStockNotSet && <Plus size={15} />}
        </button>
      </div>

      <div className="product-meta">
        <div className="card-top-row">
          <span className="product-category">{p.category}</span>
          {colors.length > 1 && (
            <div className="card-color-swatches" onClick={e => e.stopPropagation()}>
              {colors.slice(0, 4).map(c => (
                <button
                  key={c.name}
                  type="button"
                  className={`card-color-dot ${selectedColor?.name === c.name ? 'active' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  aria-label={`Select ${c.name} variant`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(c);
                  }}
                />
              ))}
              {colors.length > 4 && (
                <span className="card-color-more">+{colors.length - 4}</span>
              )}
            </div>
          )}
        </div>

        <Link
          to={`/product/${p.id}${selectedColor ? `?color=${encodeURIComponent(selectedColor.name)}` : ''}`}
          className="product-name"
        >
          {p.name}
        </Link>

        <div className="card-bottom-row">
          <div className="price-line">
            {p.oldPrice && <del>{fmt(p.oldPrice)}</del>}
            <strong>{fmt(p.price)}</strong>
          </div>
          <span className="card-stock-units">
            {totalStock !== null
              ? totalStock === 0
                ? '0 units'
                : `${totalStock} units`
              : 'Stock not set'}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items }) {
  return <div className="product-grid">{items.map(p => <ProductCard key={p.id} p={p} />)}</div>;
}

export function SectionHeading({ eyebrow, title, desc }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
    </div>
  );
}
