import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
} from 'lucide-react';
import { resolveProductViews, getViewMeta, getGarmentArchetype, getProductFallback } from '../utils/productImages';

export default function ProductGallery({ product, activeColor, onColorChange }) {
  const { views, viewList } = resolveProductViews(product, activeColor?.name);
  const archetype = getGarmentArchetype(product);
  const fallback = getProductFallback(product);

  // Active view angle: 'front' | 'back' | 'side' | 'detail'
  const [activeKey, setActiveKey] = useState('front');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Hover zoom lens state
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const mainImageRef = useRef(null);

  // Fullscreen lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Preload all 4 views so switching is instantaneous
  useEffect(() => {
    viewList.forEach(v => {
      if (v.url) {
        const img = new Image();
        img.src = v.url;
      }
    });
  }, [viewList]);

  // Handle thumbnail switch with smooth crossfade
  const handleSelectView = useCallback((key) => {
    if (key === activeKey) return;
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setActiveKey(key);
      setIsTransitioning(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [activeKey]);

  // Next / Previous view handlers
  const handlePrev = useCallback(() => {
    const currentIdx = viewList.findIndex(v => v.key === activeKey);
    const nextIdx = (currentIdx - 1 + viewList.length) % viewList.length;
    handleSelectView(viewList[nextIdx].key);
  }, [activeKey, viewList, handleSelectView]);

  const handleNext = useCallback(() => {
    const currentIdx = viewList.findIndex(v => v.key === activeKey);
    const nextIdx = (currentIdx + 1) % viewList.length;
    handleSelectView(viewList[nextIdx].key);
  }, [activeKey, viewList, handleSelectView]);

  // Cursor-following magnifier lens
  const handleMouseMove = (e) => {
    if (!mainImageRef.current) return;
    const rect = mainImageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin({ x, y });
  };

  // Fullscreen lightbox keyboard handlers
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, handlePrev, handleNext]);

  // Reset lightbox scale when opened or when view changes
  useEffect(() => {
    setLightboxScale(1);
    setLightboxPan({ x: 0, y: 0 });
  }, [activeKey, lightboxOpen]);

  // Lightbox drag pan handlers
  const handleMouseDown = (e) => {
    if (lightboxScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - lightboxPan.x, y: e.clientY - lightboxPan.y };
  };

  const handleLightboxMouseMove = (e) => {
    if (!isDragging || lightboxScale <= 1) return;
    setLightboxPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const activeImage = views[activeKey] || views.front || product.image || fallback;
  const activeMeta = viewList.find(v => v.key === activeKey) || viewList[0] || getViewMeta(activeKey, archetype);

  const hasMultipleViews = viewList.length > 1;

  return (
    <div className={`velora-gallery-container ${hasMultipleViews ? '' : 'single-view'}`}>
      {/* Clickable Thumbnails (only when multiple genuine views exist) */}
      {hasMultipleViews && (
        <aside className="gallery-thumbnails" aria-label="Product views">
          {viewList.map((view, idx) => {
            const isActive = view.key === activeKey;
            return (
              <button
                key={view.key}
                type="button"
                className={`gallery-thumb-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectView(view.key)}
                aria-label={`${view.label} (View ${idx + 1} of ${viewList.length})`}
                aria-pressed={isActive}
              >
                <div className="thumb-img-wrap">
                  <img
                    src={view.url}
                    alt={`${product.name} ${view.shortLabel}`}
                    loading="lazy"
                    onError={e => { e.currentTarget.src = fallback; }}
                  />
                </div>
                <span className="thumb-caption">{view.shortLabel}</span>
              </button>
            );
          })}
        </aside>
      )}

      {/* Main Large Image Display */}
      <div className="gallery-stage">
        <div
          ref={mainImageRef}
          className={`gallery-main-viewport ${isHoverZooming ? 'is-zoomed' : ''}`}
          onMouseEnter={() => setIsHoverZooming(true)}
          onMouseLeave={() => setIsHoverZooming(false)}
          onMouseMove={handleMouseMove}
          onClick={() => setLightboxOpen(true)}
          title="Click to expand high-resolution inspection"
        >
          {/* Main Large Image with Smooth Transitions */}
          <img
            src={activeImage}
            alt={`${product.name} - ${activeMeta.label}`}
            className={`gallery-main-img ${isTransitioning ? 'fading' : ''}`}
            style={
              isHoverZooming
                ? {
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transform: 'scale(2.2)',
                  }
                : {
                    transformOrigin: '50% 50%',
                    transform: 'scale(1)',
                  }
            }
            onError={e => { e.currentTarget.src = fallback; }}
          />

          {/* Active View Badge */}
          <span className="product-badge gallery-view-badge">
            {activeMeta.label}
          </span>

          {/* Zoom hint pill */}
          <div className="gallery-zoom-pill">
            <ZoomIn size={13} />
            <span>Hover to zoom · Click to expand</span>
          </div>

          {/* Navigation Arrows (only when multiple genuine views exist) */}
          {hasMultipleViews && (
            <>
              <button
                type="button"
                className="gallery-nav-btn prev"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                aria-label="Previous view"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="gallery-nav-btn next"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                aria-label="Next view"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Expand Fullscreen Button */}
          <button
            type="button"
            className="gallery-expand-btn"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
            aria-label="Open high-resolution fullscreen inspection"
            title="Inspect full view"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* View Angle Indicators / Selector Pills for Mobile & Quick Access */}
        {hasMultipleViews && (
          <div className="gallery-view-selector-bar">
            {viewList.map((view) => (
              <button
                key={view.key}
                type="button"
                className={`gallery-view-chip ${view.key === activeKey ? 'active' : ''}`}
                onClick={() => handleSelectView(view.key)}
              >
                {view.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen High-Resolution Lightbox Zoom Modal */}
      {lightboxOpen && (
        <div
          className="gallery-lightbox-overlay"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Product zoom inspection"
        >
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            {/* Top Toolbar */}
            <div className="lightbox-header">
              <div className="lightbox-title-wrap">
                <span className="eyebrow">{product.category}</span>
                <h3>{product.name} — {activeMeta.label}</h3>
              </div>
              <div className="lightbox-controls">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setLightboxScale(s => Math.min(s + 0.5, 3.5))}
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <ZoomIn size={20} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setLightboxScale(s => Math.max(s - 0.5, 1))}
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <ZoomOut size={20} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => { setLightboxScale(1); setLightboxPan({ x: 0, y: 0 }); }}
                  title="Reset view"
                  aria-label="Reset zoom"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  type="button"
                  className="icon-btn lightbox-close-btn"
                  onClick={() => setLightboxOpen(false)}
                  title="Close inspection"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Lightbox Main Stage */}
            <div
              className={`lightbox-viewport ${lightboxScale > 1 ? 'can-pan' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleLightboxMouseMove}
              onMouseUp={handleMouseUp}
            >
              <img
                src={activeImage}
                alt={`${product.name} - ${activeMeta.label}`}
                className="lightbox-img"
                style={{
                  transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxScale})`,
                  cursor: lightboxScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                }}
                draggable={false}
                onError={e => { e.currentTarget.src = fallback; }}
              />

              {/* Prev / Next Arrows (only when multiple views exist) */}
              {hasMultipleViews && (
                <>
                  <button
                    type="button"
                    className="gallery-nav-btn prev"
                    onClick={handlePrev}
                    aria-label="Previous view"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    className="gallery-nav-btn next"
                    onClick={handleNext}
                    aria-label="Next view"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Bottom Thumbnails */}
            <div className="lightbox-footer">
              {hasMultipleViews ? (
                <div className="lightbox-thumbs">
                  {viewList.map(view => (
                    <button
                      key={view.key}
                      type="button"
                      className={`lightbox-thumb-btn ${view.key === activeKey ? 'active' : ''}`}
                      onClick={() => handleSelectView(view.key)}
                    >
                      <img src={view.url} alt={view.label} onError={e => { e.currentTarget.src = fallback; }} />
                      <span>{view.shortLabel}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="single-view-badge" style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  <span>Single Angle View</span>
                </div>
              )}
              <span className="lightbox-hint">
                {hasMultipleViews ? 'Use arrow keys to change view · ESC to close' : 'Click & drag to pan when zoomed · ESC to close'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
