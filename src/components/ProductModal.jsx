import { useState } from 'react';
import { X, Upload, Trash2, Plus, Image as ImageIcon, Check, Layers, AlertCircle } from 'lucide-react';
import { VIEW_KEYS, VIEW_INFO, resolveProductViews } from '../utils/productImages';
import { sizeOptions } from '../utils/sizing';
import { getProductTotalStock } from '../utils/inventory';

const CATEGORIES = [
  'Women',
  'Men',
  'Kids',
  'New Arrivals',
  'Sale',
  'Dresses Collection',
  "Women's Suits Collection",
  'Bags Collection',
  'High Heels Collection',
  'Accessories Collection',
  "Men's Suits Collection",
  "Men's Shirts",
  "Men's Jeans",
  "Men's Jackets",
  "Men's Shoes",
  "Men's Accessories",
];

export default function ProductModal({ product, onClose, onSave, onDelete }) {
  const isEditing = Boolean(product?.id);

  // Form fields
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || 'Women');
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : '79.99');
  const [oldPrice, setOldPrice] = useState(product?.oldPrice != null ? String(product.oldPrice) : '');
  const [badge, setBadge] = useState(product?.badge || '');
  const [description, setDescription] = useState(
    product?.description || 'An elevated essential from the VELORA collection.'
  );

  // Determine standard size options for this product
  const defaultSizeLabels = sizeOptions(product || { name, category });
  const standardLabels = defaultSizeLabels.length > 0 ? defaultSizeLabels : ['One Size'];

  // Initialize color variants & 4-view sets & sizes stock
  const initialResolved = product ? resolveProductViews(product) : null;
  const initialColors = (product?.colors && product.colors.length > 0)
    ? product.colors
    : (initialResolved?.colors && initialResolved.colors.length > 0)
      ? initialResolved.colors
      : [{ name: 'Default', hex: '#24231f', views: product?.views || { front: product?.image || '', back: '', side: '', detail: '' } }];

  // Build colors state with both views and variant stock
  const [colors, setColors] = useState(() => {
    return initialColors.map(c => {
      // Find matching entry in product.sizes if available
      const existingSizeGroup = product?.sizes?.find(
        sg => sg.name?.toLowerCase().trim() === c.name?.toLowerCase().trim()
      );

      const variantSizes = existingSizeGroup?.sizes
        ? existingSizeGroup.sizes.map(s => ({
            label: s.label,
            stock: typeof s.stock === 'number' ? s.stock : 5,
          }))
        : standardLabels.map(label => ({
            label,
            stock: 5,
          }));

      return {
        name: c.name || 'Default',
        hex: c.hex || '#24231f',
        views: {
          front: c.views?.front || (c === initialColors[0] ? product?.image || '' : ''),
          back: c.views?.back || '',
          side: c.views?.side || '',
          detail: c.views?.detail || '',
        },
        sizes: variantSizes,
      };
    });
  });

  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#a78351');
  const [showAddColor, setShowAddColor] = useState(false);
  const [error, setError] = useState('');

  const currentColor = colors[activeColorIdx] || colors[0];

  // Update a specific view image for the active color variant
  const handleUpdateView = (viewKey, url) => {
    setColors(list =>
      list.map((c, idx) =>
        idx === activeColorIdx
          ? { ...c, views: { ...c.views, [viewKey]: url } }
          : c
      )
    );
  };

  // Handle local file upload via FileReader
  const handleFileUpload = (viewKey, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      handleUpdateView(viewKey, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Update variant stock for active color
  const handleUpdateStock = (sizeLabel, newStock) => {
    const safeStock = Math.max(0, parseInt(newStock, 10) || 0);
    setColors(list =>
      list.map((c, idx) => {
        if (idx !== activeColorIdx) return c;
        const updatedSizes = c.sizes.map(s =>
          s.label === sizeLabel ? { ...s, stock: safeStock } : s
        );
        return { ...c, sizes: updatedSizes };
      })
    );
  };

  // Add new color variant
  const handleAddColor = (e) => {
    e.preventDefault();
    if (!newColorName.trim()) return;
    const newColor = {
      name: newColorName.trim(),
      hex: newColorHex || '#24231f',
      views: { front: '', back: '', side: '', detail: '' },
      sizes: standardLabels.map(label => ({ label, stock: 5 })),
    };
    setColors(list => [...list, newColor]);
    setActiveColorIdx(colors.length);
    setNewColorName('');
    setShowAddColor(false);
  };

  // Remove color variant
  const handleRemoveColor = (indexToRemove) => {
    if (colors.length <= 1) return;
    const updated = colors.filter((_, idx) => idx !== indexToRemove);
    setColors(updated);
    setActiveColorIdx(Math.max(0, activeColorIdx - 1));
  };

  // Calculate live total stock from variant numbers
  const calculatedTotalStock = colors.reduce((acc, c) => {
    return acc + (c.sizes || []).reduce((sAcc, s) => sAcc + (s.stock || 0), 0);
  }, 0);

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a product name.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid price.');
      return;
    }

    // Determine primary front image
    const primaryFront = currentColor?.views?.front || colors[0]?.views?.front || product?.image || '';

    // Build structured sizes array with stock by color and size
    const finalSizes = colors.map(c => ({
      name: c.name,
      hex: c.hex,
      sizes: c.sizes.map(s => ({
        label: s.label,
        stock: Math.max(0, s.stock || 0),
      })),
    }));

    const payload = {
      ...(product || {}),
      id: product?.id || `product-${Date.now()}`,
      name: name.trim(),
      category,
      price: numPrice,
      oldPrice: oldPrice ? parseFloat(oldPrice) : null,
      badge: badge.trim(),
      description: description.trim(),
      image: primaryFront,
      views: currentColor?.views || {},
      colors: colors.map(c => ({
        name: c.name,
        hex: c.hex,
        views: c.views,
      })),
      sizes: finalSizes,
    };

    onSave(payload);
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div>
            <span className="eyebrow">{isEditing ? 'EDIT PRODUCT & INVENTORY' : 'NEW PRODUCT & STOCK'}</span>
            <h2>{isEditing ? `Edit: ${product.name}` : 'Add New Piece'}</h2>
            <small className="modal-stock-calc-note">
              Calculated Total Stock: <b>{calculatedTotalStock} available units</b> across {colors.length} color variant(s)
            </small>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className="admin-modal-form">
          {/* Section 1: Basic Information */}
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Product Name *</span>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Classic Tailored Blazer"
              />
            </label>

            <label className="admin-field">
              <span>Category *</span>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="admin-field">
              <span>Price (USD) *</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Original Price (Optional)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={oldPrice}
                onChange={e => setOldPrice(e.target.value)}
                placeholder="Leave blank if not on sale"
              />
            </label>

            <label className="admin-field">
              <span>Badge / Label</span>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="e.g. New Season, Atelier, Exclusive"
              />
            </label>
          </div>

          <label className="admin-field" style={{ marginTop: '16px' }}>
            <span>Editorial Description</span>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Craftsmanship details, tailoring notes, fabric composition..."
            />
          </label>

          {/* Section 2: Color Variants & Stock Quantities */}
          <div className="admin-colors-management-block">
            <div className="admin-block-header">
              <div>
                <h4>Color Variants & Real Available Stock</h4>
                <p>Configure color options and enter exact physical inventory units per size.</p>
              </div>
              <button
                type="button"
                className="btn btn-outline admin-btn-sm"
                onClick={() => setShowAddColor(true)}
              >
                <Plus size={14} /> Add Color Variant
              </button>
            </div>

            {/* Color Swatch Tabs */}
            <div className="admin-color-tabs-row">
              {colors.map((c, idx) => (
                <div
                  key={c.name + idx}
                  className={`admin-color-tab-pill ${activeColorIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveColorIdx(idx)}
                >
                  <span className="color-swatch-circle" style={{ backgroundColor: c.hex }} />
                  <b>{c.name}</b>
                  {colors.length > 1 && (
                    <button
                      type="button"
                      className="admin-color-del-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveColor(idx);
                      }}
                      title="Remove color variant"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Color Sub-form */}
            {showAddColor && (
              <div className="admin-add-color-drawer">
                <input
                  type="text"
                  placeholder="Color Name (e.g. Midnight Navy)"
                  value={newColorName}
                  onChange={e => setNewColorName(e.target.value)}
                  autoFocus
                />
                <input
                  type="color"
                  value={newColorHex}
                  onChange={e => setNewColorHex(e.target.value)}
                  title="Pick color hex code"
                />
                <button type="button" className="btn btn-dark admin-btn-sm" onClick={handleAddColor}>
                  Save Color
                </button>
                <button type="button" className="text-btn" onClick={() => setShowAddColor(false)}>
                  Cancel
                </button>
              </div>
            )}

            {/* Real Stock Quantities Table for Active Color */}
            <div className="admin-modal-stock-table-wrap">
              <span className="eyebrow" style={{ marginBottom: 8, display: 'block' }}>
                AVAILABLE QUANTITIES FOR: {currentColor.name}
              </span>
              <div className="modal-stock-grid">
                {currentColor.sizes?.map(sizeItem => (
                  <div key={sizeItem.label} className="modal-stock-cell">
                    <span className="modal-size-label">Size {sizeItem.label}</span>
                    <input
                      type="number"
                      min="0"
                      value={sizeItem.stock}
                      onChange={e => handleUpdateStock(sizeItem.label, e.target.value)}
                      className="modal-stock-input"
                    />
                    <small className="modal-stock-unit-label">pieces</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: 4-View Image Uploader */}
          <div className="admin-views-management-block">
            <div className="admin-block-header">
              <div>
                <h4>Multi-Angle Image Views ({currentColor.name})</h4>
                <p>Assign Front, Back, Side, and Tailoring Detail photos for this color variant.</p>
              </div>
            </div>

            <div className="admin-view-slots-grid">
              {VIEW_KEYS.map(key => {
                const info = VIEW_INFO[key];
                const currentUrl = currentColor.views[key];

                return (
                  <div key={key} className={`admin-view-slot-card ${currentUrl ? 'filled' : 'empty'}`}>
                    <div className="view-slot-header">
                      <b>{info.label}</b>
                      {currentUrl ? (
                        <span className="view-slot-badge ready"><Check size={11} /> Ready</span>
                      ) : (
                        <span className="view-slot-badge missing">Pending</span>
                      )}
                    </div>

                    <div className="view-slot-preview-box">
                      {currentUrl ? (
                        <img src={currentUrl} alt={info.label} />
                      ) : (
                        <div className="view-slot-placeholder">
                          <ImageIcon size={24} />
                          <small>{info.description}</small>
                        </div>
                      )}
                    </div>

                    <div className="view-slot-inputs">
                      <input
                        type="url"
                        placeholder="Paste image URL..."
                        value={currentUrl}
                        onChange={e => handleUpdateView(key, e.target.value)}
                        className="admin-url-input"
                      />
                      <label className="btn btn-outline admin-upload-btn">
                        <Upload size={12} /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => handleFileUpload(key, e.target.files?.[0])}
                        />
                      </label>
                      {currentUrl && (
                        <button
                          type="button"
                          className="text-btn admin-clear-slot-btn"
                          onClick={() => handleUpdateView(key, '')}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="admin-modal-footer">
            <div>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-outline admin-delete-piece-btn"
                  onClick={() => {
                    if (window.confirm(`Permanently remove "${product.name}" from catalog?`)) {
                      onDelete(product.id);
                    }
                  }}
                >
                  <Trash2 size={15} /> Delete Piece
                </button>
              )}
            </div>

            <div className="admin-modal-footer-right">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-dark">
                {isEditing ? 'Save Changes & Stock' : 'Create Piece & Land Stock'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
