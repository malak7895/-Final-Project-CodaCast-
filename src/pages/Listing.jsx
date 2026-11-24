import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
  Check,
  Grid3X3,
  LayoutGrid,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import usePageTitle from '../utils/usePageTitle';
import { useStore } from '../context/StoreContext';
import { ProductGrid } from '../components/ProductCard';
import { getCategoryTree, matchesSubcategory, isProductInDepartment } from '../data/categories';

const pageData = {
  women: {
    deptKey: 'Women',
    eyebrow: "THE WOMEN'S ATELIER",
    title: 'Women',
    desc: 'Thoughtfully tailored silhouettes, sculptural dresses, and considered daily essentials crafted from fine silks, virgin wool, and pure Egyptian cotton.',
    filter: p => isProductInDepartment(p, 'women'),
  },
  men: {
    deptKey: 'Men',
    eyebrow: "THE MEN'S ATELIER",
    title: 'Men',
    desc: 'Unstructured tailoring, crisp poplin shirts, fine knitwear, and architectural outerwear designed for modern ease and permanence.',
    filter: p => isProductInDepartment(p, 'men'),
  },
  kids: {
    deptKey: 'Kids',
    eyebrow: "THE PETITE EDIT",
    title: 'Kids',
    desc: 'Playful proportions and pure natural textiles designed for little adventures and cherished family occasions.',
    filter: p => isProductInDepartment(p, 'kids'),
  },
  'new-arrivals': {
    deptKey: 'New Arrivals',
    eyebrow: 'FRESHLY DISCOVERED',
    title: 'New Arrivals',
    desc: 'The latest seasonal pieces, freshly released from the VELORA atelier.',
    filter: p => p.category === 'New Arrivals' || p.badge === 'New Season' || p.badge === 'New' || p.isNew,
  },
  collection: {
    deptKey: 'Collection',
    eyebrow: 'CURATED ARCHIVE',
    title: 'The Collection',
    desc: 'Explore the full VELORA universe — an enduring repertoire of timeless pieces.',
    filter: p => p.category !== 'Sale',
  },
  sale: {
    deptKey: 'Sale',
    eyebrow: 'SEASONAL ARCHIVE PRIVILEGE',
    title: 'Archive Sale',
    desc: 'Curated archive silhouettes offered at seasonal reductions of up to 40%.',
    filter: p => p.category === 'Sale' || (p.oldPrice && p.oldPrice > p.price),
  },
  category: {
    deptKey: 'Browse',
    eyebrow: 'CURATED FOR YOU',
    title: 'Browse',
    desc: 'Explore considered VELORA pieces.',
    filter: () => true,
  },
};

export default function Listing({ type }) {
  const urlParams = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  // Route parameters
  const deptParam = urlParams.dept || null;
  const urlSub = urlParams.sub || params.get('sub') || '';

  // Determine active department definition
  let d = pageData[type] || pageData.collection;
  if ((type === 'category' || type === 'dynamic') && deptParam) {
    const key = deptParam.toLowerCase();
    const base = pageData[key] || {
      deptKey: deptParam.charAt(0).toUpperCase() + deptParam.slice(1),
      eyebrow: 'CURATED FOR YOU',
      title: deptParam.charAt(0).toUpperCase() + deptParam.slice(1),
      desc: `Explore the ${deptParam} edit — considered pieces for every style and occasion.`,
      filter: p => isProductInDepartment(p, deptParam),
    };
    d = {
      ...base,
      title: deptParam.charAt(0).toUpperCase() + deptParam.slice(1),
      deptKey: deptParam.charAt(0).toUpperCase() + deptParam.slice(1),
      filter: base.filter || (p => isProductInDepartment(p, deptParam)),
    };
  }

  usePageTitle(urlSub ? `${urlSub} — ${d.title} | VELORA` : `${d.title} — VELORA Atelier`);
  const { products, fmt } = useStore();

  // Filter & Layout States
  const [activeSubcategory, setActiveSubcategory] = useState(urlSub);
  const [sort, setSort] = useState('featured');
  const [searchQuery, setSearchQuery] = useState(params.get('search') || '');
  const [priceTier, setPriceTier] = useState('all'); // 'all' | 'under-50' | '50-100' | '100-plus'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [gridCols, setGridCols] = useState(4); // 3 or 4
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state when URL parameter changes
  useEffect(() => {
    setActiveSubcategory(urlSub);
  }, [urlSub]);

  useEffect(() => {
    setSearchQuery(params.get('search') || '');
  }, [params]);

  // Determine current department's categories
  const categoryTree = getCategoryTree();
  const currentDeptKey = d.deptKey || 'Women';
  const subcategoryList = categoryTree[currentDeptKey] || categoryTree.Women || [];
  const basePath = type === 'category' ? `/category/${(deptParam || 'women').toLowerCase()}` : `/${type}`;

  // 1. Base Department Pool
  const departmentPool = useMemo(() => {
    return products.filter(d.filter);
  }, [products, d]);

  // Calculate product counts per subcategory for active indicators
  const subcategoryCounts = useMemo(() => {
    const counts = {};
    for (const sub of subcategoryList) {
      counts[sub] = departmentPool.filter(p => matchesSubcategory(p, sub)).length;
    }
    return counts;
  }, [departmentPool, subcategoryList]);

  // 2. Filtered Items Pipeline
  const filteredItems = useMemo(() => {
    let result = [...departmentPool];

    // Filter by active subcategory
    if (activeSubcategory) {
      result = result.filter(p => matchesSubcategory(p, activeSubcategory));
    }

    // Filter by internal search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p => (p.name + ' ' + (p.category || '') + ' ' + (p.description || '')).toLowerCase().includes(q)
      );
    }

    // Filter by price tier
    if (priceTier === 'under-50') {
      result = result.filter(p => p.price < 50);
    } else if (priceTier === '50-100') {
      result = result.filter(p => p.price >= 50 && p.price <= 100);
    } else if (priceTier === '100-plus') {
      result = result.filter(p => p.price > 100);
    }

    // Filter by stock
    if (inStockOnly) {
      result = result.filter(p => {
        if (!Array.isArray(p.sizes) || p.sizes.length === 0) return false;
        let total = 0;
        for (const c of p.sizes) {
          if (Array.isArray(c.sizes)) {
            for (const s of c.sizes) total += s.stock || 0;
          }
        }
        return total > 0;
      });
    }

    // Sorting
    if (sort === 'low') result.sort((a, b) => a.price - b.price);
    else if (sort === 'high') result.sort((a, b) => b.price - a.price);
    else if (sort === 'az') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'newest') result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

    return result;
  }, [departmentPool, activeSubcategory, searchQuery, priceTier, inStockOnly, sort]);

  // Handler to pick a subcategory
  const handleSelectSub = sub => {
    if (sub === activeSubcategory) {
      // Toggle off
      setActiveSubcategory('');
      setParams(prev => {
        prev.delete('sub');
        return prev;
      });
    } else {
      setActiveSubcategory(sub);
      setParams(prev => {
        prev.set('sub', sub);
        return prev;
      });
    }
    setMobileFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    setActiveSubcategory('');
    setSearchQuery('');
    setPriceTier('all');
    setInStockOnly(false);
    setParams({});
  };

  const hasActiveFilters = Boolean(
    activeSubcategory || searchQuery || priceTier !== 'all' || inStockOnly
  );

  return (
    <div className="listing-page-container">
      {/* Editorial Page Banner */}
      <div className={`listing-hero-banner ${type === 'sale' ? 'sale-theme' : ''}`}>
        <div className="listing-banner-inner">
          <span className="banner-eyebrow">
            <Sparkles size={11} className="eyebrow-sparkle" />
            {d.eyebrow}
          </span>
          <h1 className="banner-title">
            {activeSubcategory ? `${d.title} — ${activeSubcategory}` : d.title}
          </h1>
          <p className="banner-desc">{d.desc}</p>

          <div className="banner-quick-stats">
            <span>{departmentPool.length} Atelier Pieces</span>
            <span className="sep">/</span>
            <span>{subcategoryList.length} Curated Categories</span>
          </div>
        </div>
      </div>

      {/* Top Mobile Quick-Scroll Categories */}
      {subcategoryList.length > 0 && (
        <div className="mobile-category-pill-strip" aria-label="Category Quick Filter">
          <button
            type="button"
            className={`pill-chip ${!activeSubcategory ? 'active' : ''}`}
            onClick={() => handleSelectSub('')}
          >
            All {d.title} ({departmentPool.length})
          </button>
          {subcategoryList.map(sub => {
            const count = subcategoryCounts[sub] || 0;
            return (
              <button
                key={sub}
                type="button"
                className={`pill-chip ${activeSubcategory === sub ? 'active' : ''}`}
                onClick={() => handleSelectSub(sub)}
              >
                {sub}
                {count > 0 && <span className="chip-count">({count})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="listing-layout-wrap">
        {/* ====================================================================
            LEFT COLUMN: VISIBLE CATEGORY SIDEBAR (Desktop)
           ==================================================================== */}
        <aside className="listing-sidebar-col" aria-label="Category Navigation">
          <div className="sidebar-sticky-panel">
            {/* Department Title & Clear */}
            <div className="sidebar-header-row">
              <div>
                <span className="sidebar-super">DEPARTMENT</span>
                <h3 className="sidebar-dept-title">{d.title} Categories</h3>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="sidebar-reset-btn"
                  onClick={handleClearAllFilters}
                  title="Reset all filters"
                >
                  <RotateCcw size={12} /> Clear
                </button>
              )}
            </div>

            {/* Category Navigation List */}
            <div className="sidebar-section">
              <span className="sidebar-sub-heading">BROWSE BY CATEGORY</span>
              <ul className="sidebar-cat-list">
                {/* All Pieces Link */}
                <li className="sidebar-cat-item">
                  <button
                    type="button"
                    className={`sidebar-cat-btn ${!activeSubcategory ? 'is-active' : ''}`}
                    onClick={() => handleSelectSub('')}
                  >
                    <span className="cat-btn-label">
                      {!activeSubcategory && <span className="active-dot-pip" />}
                      All {d.title}
                    </span>
                    <span className="cat-btn-count">{departmentPool.length}</span>
                  </button>
                </li>

                {/* Subcategories */}
                {subcategoryList.map(sub => {
                  const isActive = activeSubcategory === sub;
                  const count = subcategoryCounts[sub] || 0;
                  return (
                    <li key={sub} className="sidebar-cat-item">
                      <button
                        type="button"
                        className={`sidebar-cat-btn ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleSelectSub(sub)}
                      >
                        <span className="cat-btn-label">
                          {isActive && <span className="active-dot-pip" />}
                          {sub}
                        </span>
                        <span className={`cat-btn-count ${count === 0 ? 'zero' : ''}`}>
                          {count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Price Range Filter */}
            <div className="sidebar-section">
              <span className="sidebar-sub-heading">PRICE RANGE</span>
              <div className="sidebar-radio-group">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under-50', label: 'Under $50' },
                  { id: '50-100', label: '$50 to $100' },
                  { id: '100-plus', label: '$100 and above' },
                ].map(tier => (
                  <label key={tier.id} className="sidebar-radio-label">
                    <input
                      type="radio"
                      name="priceTier"
                      checked={priceTier === tier.id}
                      onChange={() => setPriceTier(tier.id)}
                    />
                    <span>{tier.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* In Stock Only Checkbox */}
            <div className="sidebar-section">
              <label className="sidebar-checkbox-label">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                />
                <span>Available Units Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* ====================================================================
            RIGHT COLUMN: LISTING TOOLBAR & PRODUCTS GRID
           ==================================================================== */}
        <main className="listing-main-col">
          {/* Controls & Filter Toolbar */}
          <div className="listing-toolbar-card">
            {/* Left: Active Indicators & Piece Count */}
            <div className="toolbar-left-info">
              <button
                type="button"
                className="mobile-filter-open-btn"
                onClick={() => setMobileFilterOpen(true)}
              >
                <SlidersHorizontal size={15} />
                <span>Categories & Filters</span>
                {hasActiveFilters && <span className="active-filter-badge" />}
              </button>

              <span className="listing-count-tag">
                <b>{filteredItems.length}</b> pieces found
                {activeSubcategory && (
                  <span className="active-sub-tag">
                    in <em>{activeSubcategory}</em>
                    <button
                      type="button"
                      className="tag-clear-btn"
                      onClick={() => handleSelectSub('')}
                      aria-label="Remove category filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </span>
            </div>

            {/* Right: Search, Sorting, Grid Switcher */}
            <div className="toolbar-right-controls">
              {/* Internal Search */}
              <div className="toolbar-search-box">
                <Search size={14} className="toolbar-search-icon" />
                <input
                  type="text"
                  placeholder={`Search ${d.title}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="toolbar-search-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <label className="toolbar-sort-wrap">
                <select value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="featured">Curated & Featured</option>
                  <option value="newest">Newest Releases</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                  <option value="az">Alphabetical A–Z</option>
                </select>
                <ChevronDown size={13} className="sort-chevron" />
              </label>

              {/* Grid Column Toggles (Desktop) */}
              <div className="toolbar-grid-switcher" aria-label="Grid Column Display">
                <button
                  type="button"
                  className={`grid-view-btn ${gridCols === 3 ? 'active' : ''}`}
                  onClick={() => setGridCols(3)}
                  aria-label="3 Column Grid"
                  title="3 Columns"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  type="button"
                  className={`grid-view-btn ${gridCols === 4 ? 'active' : ''}`}
                  onClick={() => setGridCols(4)}
                  aria-label="4 Column Grid"
                  title="4 Columns"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Items Grid or Empty State */}
          {filteredItems.length > 0 ? (
            <div className={`products-container grid-cols-${gridCols}`}>
              <ProductGrid items={filteredItems} />
            </div>
          ) : (
            <div className="listing-empty-state">
              <span className="empty-eyebrow">NO PIECES MATCH YOUR SELECTION</span>
              <h3>No items found in {activeSubcategory || d.title}</h3>
              <p>
                Try selecting another category, clearing your search criteria, or exploring our entire {d.title} collection.
              </p>
              <div className="empty-actions">
                <button type="button" className="btn btn-dark" onClick={handleClearAllFilters}>
                  View All {d.title} Pieces
                </button>
                <Link to="/collection" className="btn btn-outline">
                  Browse Full Atelier Collection
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Slide-Out Category & Filter Drawer */}
      {mobileFilterOpen && (
        <div className="mobile-filter-drawer-overlay" onClick={() => setMobileFilterOpen(false)}>
          <div className="mobile-filter-drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="mobile-filter-drawer-header">
              <div>
                <span className="drawer-subtitle">FILTER BY CATEGORY</span>
                <h3>{d.title} Categories</h3>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-filter-drawer-body">
              {/* Category Options */}
              <div className="drawer-filter-group">
                <span className="drawer-group-title">Categories</span>
                <div className="drawer-cat-buttons">
                  <button
                    type="button"
                    className={`drawer-cat-pill ${!activeSubcategory ? 'active' : ''}`}
                    onClick={() => handleSelectSub('')}
                  >
                    All {d.title} ({departmentPool.length})
                  </button>
                  {subcategoryList.map(sub => {
                    const isActive = activeSubcategory === sub;
                    const count = subcategoryCounts[sub] || 0;
                    return (
                      <button
                        key={sub}
                        type="button"
                        className={`drawer-cat-pill ${isActive ? 'active' : ''}`}
                        onClick={() => handleSelectSub(sub)}
                      >
                        {sub}
                        <span className="cat-pill-count">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="drawer-filter-group">
                <span className="drawer-group-title">Price Range</span>
                <div className="sidebar-radio-group">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under-50', label: 'Under $50' },
                    { id: '50-100', label: '$50 to $100' },
                    { id: '100-plus', label: '$100 and above' },
                  ].map(tier => (
                    <label key={tier.id} className="sidebar-radio-label">
                      <input
                        type="radio"
                        name="mobilePriceTier"
                        checked={priceTier === tier.id}
                        onChange={() => setPriceTier(tier.id)}
                      />
                      <span>{tier.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock Filter */}
              <div className="drawer-filter-group">
                <label className="sidebar-checkbox-label">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                  />
                  <span>Show In-Stock Units Only</span>
                </label>
              </div>
            </div>

            <div className="mobile-filter-drawer-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClearAllFilters}
              >
                Reset Filters
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => setMobileFilterOpen(false)}
              >
                Show {filteredItems.length} Pieces
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
