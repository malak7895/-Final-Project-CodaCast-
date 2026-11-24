import { useEffect, useState, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Building2,
  Boxes,
  ShoppingBag,
  Users,
  Tag,
  Image as ImageIcon,
  Settings,
  Plus,
  Search,
  SlidersHorizontal,
  Edit3,
  Trash2,
  ExternalLink,
  RefreshCw,
  Eye,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Minus,
  Check,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { isAdminEmail, authConfigured, ADMIN_EMAILS } from '../firebase';
import { STATUSES } from '../utils/orders';
import {
  getCategoryTree,
  addSubcategory,
  removeSubcategory,
  addDepartment,
  resetCategoryTree,
} from '../data/categories';
import {
  getPromotions,
  addPromotion,
  togglePromotion,
  deletePromotion,
  resetPromotions,
} from '../utils/promotions';
import { resolveProductViews, VIEW_KEYS, VIEW_INFO } from '../utils/productImages';
import { getProductVariantMatrix, initProductStock } from '../utils/inventory';
import usePageTitle from '../utils/usePageTitle';
import ProductModal from '../components/ProductModal';

const FALLBACK = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400';

export default function Admin() {
  usePageTitle('Admin Executive Dashboard — VELORA');
  const { user, loading } = useAuth();
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    resetProducts,
    fmt,
    // Inventory
    getProductTotalStock,
    getVariantStock,
    getProductStockStatus,
    setSizeStock,
    adjustSizeStock,
    initPieceStock,
    stockStats,
    // Orders
    orders,
    ordersLoading,
    updateOrderStatus,
    resetOrders,
  } = useStore();

  // Active admin section
  // 'overview' | 'products' | 'categories' | 'departments' | 'inventory' | 'orders' | 'customers' | 'promotions' | 'images' | 'settings'
  const [tab, setTab] = useState('overview');

  // Modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Selected Order for Invoice view
  const [viewingOrder, setViewingOrder] = useState(null);

  // Products Tab Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockConditionFilter, setStockConditionFilter] = useState('All');
  const [sortField, setSortField] = useState('featured');

  // Inventory Tab Filter State
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCatFilter, setInventoryCatFilter] = useState('All');
  const [inventoryConditionFilter, setInventoryConditionFilter] = useState('All');

  // Categories & Departments State
  const [categoryTree, setCategoryTree] = useState(getCategoryTree);
  const [selectedDept, setSelectedDept] = useState('Women');
  const [newSubcatName, setNewSubcatName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');

  // Promotions State
  const [promotions, setPromotions] = useState(getPromotions);
  const [showNewPromoForm, setShowNewPromoForm] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    type: 'percent',
    value: 15,
    minSpend: 0,
    description: '',
  });

  // Image Management Filter State
  const [imageCatFilter, setImageCatFilter] = useState('All');
  const [imageMissingOnly, setImageMissingOnly] = useState(false);

  // Orders Tab Filter State
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Settings State
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'VELORA Maison & Atelier',
    slogan: 'The Art of Dressing',
    contactEmail: 'concierge@velora-couture.com',
    contactPhone: '+20 2 2735 9000',
    freeShippingThreshold: 5000,
    lowStockThreshold: 10,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Authentication check: allow access in demo mode or for authenticated admin
  const hasAdminEmails = Array.isArray(ADMIN_EMAILS) && ADMIN_EMAILS.length > 0;
  const admin = !authConfigured || !hasAdminEmails || (user && !user.isDemo && isAdminEmail(user.email));

  if (loading && authConfigured) {
    return <main className="empty-state"><p>Authenticating VELORA administrative credentials…</p></main>;
  }

  if (!admin) {
    return <Navigate to="/" replace />;
  }

  // --------------------------------------------------------------------------
  // Overview Calculations
  // --------------------------------------------------------------------------
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const uniqueCustomersCount = useMemo(() => {
    const emails = new Set();
    orders.forEach(o => {
      const email = o.customer?.email || o.customer?.phone || o.uid;
      if (email) emails.add(email);
    });
    return Math.max(emails.size, 1);
  }, [orders]);

  // Aggregate Best Selling Products from real order items
  const bestSellers = useMemo(() => {
    const productSalesMap = {};
    orders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!productSalesMap[item.id]) {
            productSalesMap[item.id] = {
              id: item.id,
              name: item.name,
              image: item.image,
              unitsSold: 0,
              revenue: 0,
            };
          }
          productSalesMap[item.id].unitsSold += (item.qty || 1);
          productSalesMap[item.id].revenue += (item.price || 0) * (item.qty || 1);
        });
      }
    });

    return Object.values(productSalesMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5)
      .map(s => {
        const prod = products.find(p => p.id === s.id);
        return {
          ...s,
          category: prod?.category || 'Atelier',
          remainingStock: prod ? getProductTotalStock(prod) : null,
        };
      });
  }, [orders, products, getProductTotalStock]);

  // Sales breakdown by order status
  const salesByStatus = useMemo(() => {
    const map = {};
    STATUSES.forEach(s => { map[s] = { count: 0, revenue: 0 }; });
    orders.forEach(o => {
      if (map[o.status]) {
        map[o.status].count += 1;
        map[o.status].revenue += o.total || 0;
      }
    });
    return map;
  }, [orders]);

  // Unique customers list
  const customersList = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const key = o.customer?.email || o.customer?.phone || o.customer?.name || o.uid;
      if (!map[key]) {
        map[key] = {
          name: o.customer?.name || 'Private Client',
          email: o.customer?.email || 'N/A',
          phone: o.customer?.phone || 'N/A',
          area: o.customer?.area || 'Egypt',
          address: o.customer?.address || '',
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: o.createdAt,
          isDemo: Boolean(o.isDemo || o.customer?.isDemo),
        };
      }
      map[key].ordersCount += 1;
      map[key].totalSpent += o.total || 0;
      if (!o.isDemo) {
        map[key].isDemo = false;
      }
      if (o.createdAt > map[key].lastOrderDate) {
        map[key].lastOrderDate = o.createdAt;
      }
    });
    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Filtered Products for Products Tab
  const categoriesList = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchSearch = (p.name + ' ' + p.category + ' ' + p.id)
        .toLowerCase()
        .includes(search.toLowerCase());

      const stockStatus = getProductStockStatus(p, storeSettings.lowStockThreshold);
      let matchCondition = true;
      if (stockConditionFilter === 'in_stock') matchCondition = stockStatus === 'in_stock';
      if (stockConditionFilter === 'low_stock') matchCondition = stockStatus === 'low_stock';
      if (stockConditionFilter === 'out_of_stock') matchCondition = stockStatus === 'out_of_stock';
      if (stockConditionFilter === 'not_set') matchCondition = stockStatus === 'not_set';

      return matchCat && matchSearch && matchCondition;
    }).sort((a, b) => {
      if (sortField === 'name') return a.name.localeCompare(b.name);
      if (sortField === 'price-asc') return a.price - b.price;
      if (sortField === 'price-desc') return b.price - a.price;
      if (sortField === 'stock-asc') return (getProductTotalStock(a) || 0) - (getProductTotalStock(b) || 0);
      if (sortField === 'stock-desc') return (getProductTotalStock(b) || 0) - (getProductTotalStock(a) || 0);
      return 0;
    });
  }, [products, categoryFilter, search, stockConditionFilter, sortField, getProductStockStatus, storeSettings.lowStockThreshold, getProductTotalStock]);

  // Filtered Products for Inventory Matrix Tab
  const filteredInventoryProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = inventoryCatFilter === 'All' || p.category === inventoryCatFilter;
      const matchSearch = (p.name + ' ' + p.id).toLowerCase().includes(inventorySearch.toLowerCase());
      const stockStatus = getProductStockStatus(p, storeSettings.lowStockThreshold);

      let matchCondition = true;
      if (inventoryConditionFilter === 'in_stock') matchCondition = stockStatus === 'in_stock';
      if (inventoryConditionFilter === 'low_stock') matchCondition = stockStatus === 'low_stock';
      if (inventoryConditionFilter === 'out_of_stock') matchCondition = stockStatus === 'out_of_stock';
      if (inventoryConditionFilter === 'not_set') matchCondition = stockStatus === 'not_set';

      return matchCat && matchSearch && matchCondition;
    });
  }, [products, inventoryCatFilter, inventorySearch, inventoryConditionFilter, getProductStockStatus, storeSettings.lowStockThreshold]);

  // Filtered Orders for Orders Tab
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
      const matchSearch = (
        o.id + ' ' +
        (o.customer?.name || '') + ' ' +
        (o.customer?.phone || '') + ' ' +
        (o.customer?.email || '')
      ).toLowerCase().includes(orderSearchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct?.id) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id) => {
    deleteProduct(id);
    setIsModalOpen(false);
  };

  // Category handlers
  const handleAddSubcat = (e) => {
    e.preventDefault();
    if (!newSubcatName.trim()) return;
    const updated = addSubcategory(selectedDept, newSubcatName.trim());
    setCategoryTree({ ...updated });
    setNewSubcatName('');
  };

  const handleRemoveSubcat = (sub) => {
    if (window.confirm(`Remove subcategory "${sub}" from ${selectedDept}?`)) {
      const updated = removeSubcategory(selectedDept, sub);
      setCategoryTree({ ...updated });
    }
  };

  const handleAddDept = (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const updated = addDepartment(newDeptName.trim());
    setCategoryTree({ ...updated });
    setSelectedDept(newDeptName.trim());
    setNewDeptName('');
  };

  // Promo handlers
  const handleAddPromo = (e) => {
    e.preventDefault();
    if (!newPromo.code.trim()) return;
    const updated = addPromotion(newPromo);
    setPromotions([...updated]);
    setNewPromo({ code: '', type: 'percent', value: 15, minSpend: 0, description: '' });
    setShowNewPromoForm(false);
  };

  const handleTogglePromo = (code) => {
    const updated = togglePromotion(code);
    setPromotions([...updated]);
  };

  const handleDeletePromo = (code) => {
    if (window.confirm(`Delete promo code "${code}"?`)) {
      const updated = deletePromotion(code);
      setPromotions([...updated]);
    }
  };

  // Nav Items Definition
  const adminNav = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'products', label: `Products (${products.length})`, icon: Package },
    { key: 'inventory', label: `Inventory (${stockStats.totalUnitsInStock} units)`, icon: Boxes },
    { key: 'categories', label: 'Categories', icon: FolderTree },
    { key: 'departments', label: 'Departments', icon: Building2 },
    { key: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
    { key: 'customers', label: `Customers (${customersList.length})`, icon: Users },
    { key: 'promotions', label: `Discounts & Promos (${promotions.length})`, icon: Tag },
    { key: 'images', label: 'Image Management', icon: ImageIcon },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <main className="admin-page-wrap">
      {/* Admin Executive Header */}
      <div className="admin-header-strip">
        <div className="admin-brand-col">
          <span className="eyebrow">VELORA MAISON · ATELIER MANAGEMENT</span>
          <h1>Maison Executive Dashboard</h1>
          <p className="admin-subtitle">
            Centralized storefront synchronization, multi-variant inventory control, and order fulfillment.
          </p>
        </div>
        <div className="admin-top-actions">
          {tab === 'products' && (
            <button type="button" className="btn btn-dark" onClick={handleOpenAdd}>
              <Plus size={16} /> Add New Piece
            </button>
          )}
          {tab === 'inventory' && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                const unconfigured = products.filter(p => !p.sizes || p.sizes.length === 0);
                if (unconfigured.length === 0) {
                  alert('All pieces already have variant stock configured.');
                  return;
                }
                if (window.confirm(`Initialize variant stock (5 units each) for ${unconfigured.length} unconfigured pieces?`)) {
                  unconfigured.forEach(p => initPieceStock(p.id, 5));
                }
              }}
            >
              <Boxes size={15} /> Auto-Configure Unset Stock ({stockStats.notSetCount})
            </button>
          )}
          <Link to="/" className="btn btn-outline" target="_blank" rel="noreferrer" title="Open storefront in new tab">
            <ExternalLink size={14} /> Storefront
          </Link>
        </div>
      </div>

      {/* 10-Section Navigation Bar */}
      <div className="admin-nav-scroll-wrap">
        <div className="admin-tabs-nav">
          {adminNav.map(item => {
            const Icon = item.icon;
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`admin-nav-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => setTab(item.key)}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================================
          SECTION 1: OVERVIEW DASHBOARD
         ====================================================================== */}
      {tab === 'overview' && (
        <section className="admin-overview-view">
          {/* Key Metric Cards */}
          <div className="admin-metrics-row">
            <div className="admin-metric-card">
              <div className="metric-card-top">
                <span className="metric-title">TOTAL PRODUCTS</span>
                <Package size={18} className="metric-icon" />
              </div>
              <strong className="metric-val">{products.length}</strong>
              <small className="metric-sub">{stockStats.inStockCount} healthy · {stockStats.notSetCount} unset</small>
            </div>

            <div className="admin-metric-card">
              <div className="metric-card-top">
                <span className="metric-title">AVAILABLE UNITS IN STOCK</span>
                <Boxes size={18} className="metric-icon" />
              </div>
              <strong className="metric-val">{stockStats.totalUnitsInStock.toLocaleString()}</strong>
              <small className="metric-sub">Calculated live across all color & size variants</small>
            </div>

            <div className="admin-metric-card">
              <div className="metric-card-top">
                <span className="metric-title">TOTAL ORDERS</span>
                <ShoppingBag size={18} className="metric-icon" />
              </div>
              <strong className="metric-val">{orders.length}</strong>
              <small className="metric-sub">{salesByStatus['Processing']?.count || 0} processing (includes demo records)</small>
            </div>

            <div className="admin-metric-card">
              <div className="metric-card-top">
                <span className="metric-title">TOTAL REVENUE</span>
                <DollarSign size={18} className="metric-icon" />
              </div>
              <strong className="metric-val">{fmt(totalRevenue)}</strong>
              <small className="metric-sub">Across recorded transactions</small>
            </div>

            <div className="admin-metric-card">
              <div className="metric-card-top">
                <span className="metric-title">ACTIVE CLIENTS</span>
                <Users size={18} className="metric-icon" />
              </div>
              <strong className="metric-val">{uniqueCustomersCount}</strong>
              <small className="metric-sub">Client profiles (includes demonstration data)</small>
            </div>

            <div className={`admin-metric-card ${stockStats.lowStockCount > 0 ? 'alert-metric' : ''}`}>
              <div className="metric-card-top">
                <span className="metric-title">LOW STOCK ALERTS</span>
                <AlertTriangle size={18} className="metric-icon" />
              </div>
              <strong className="metric-val">{stockStats.lowStockCount}</strong>
              <small className="metric-sub">Pieces requiring atelier replenishment</small>
            </div>

            <div className={`admin-metric-card ${stockStats.outOfStockCount > 0 ? 'critical-metric' : ''}`}>
              <div className="metric-card-top">
                <span className="metric-title">OUT OF STOCK</span>
                <XCircle size={18} className="metric-icon" />
              </div>
              <strong className="metric-val">{stockStats.outOfStockCount}</strong>
              <small className="metric-sub">0 units available in physical inventory</small>
            </div>
          </div>

          {/* Quick Section Jumps */}
          <div className="admin-quick-actions-bar">
            <span className="eyebrow">QUICK DIRECTORY JUMPS:</span>
            <button type="button" className="quick-jump-btn" onClick={() => setTab('inventory')}>
              <Boxes size={13} /> Stock Inventory Matrix →
            </button>
            <button type="button" className="quick-jump-btn" onClick={() => setTab('products')}>
              <Package size={13} /> Product Catalog & Pricing →
            </button>
            <button type="button" className="quick-jump-btn" onClick={() => setTab('orders')}>
              <ShoppingBag size={13} /> Customer Orders Sheet →
            </button>
            <button type="button" className="quick-jump-btn" onClick={() => setTab('categories')}>
              <FolderTree size={13} /> Edit Categories →
            </button>
            <button type="button" className="quick-jump-btn" onClick={() => setTab('promotions')}>
              <Tag size={13} /> Active Discounts →
            </button>
          </div>

          {/* Grid Layout: Sales Overview & Best Sellers */}
          <div className="overview-two-col-grid">
            {/* Sales Performance Card */}
            <div className="overview-panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">FINANCIAL PERFORMANCE</span>
                  <h3>Sales & Order Status Breakdown</h3>
                </div>
              </div>

              <div className="sales-status-breakdown-list">
                {STATUSES.map(st => {
                  const data = salesByStatus[st] || { count: 0, revenue: 0 };
                  const pct = totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0;
                  return (
                    <div key={st} className="sales-status-row">
                      <div className="status-label-group">
                        <span className={`status-dot dot-${st.toLowerCase().replace(/\s+/g, '-')}`} />
                        <b>{st}</b>
                        <small>({data.count} {data.count === 1 ? 'order' : 'orders'})</small>
                      </div>
                      <div className="status-bar-track">
                        <div className="status-bar-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                      <div className="status-val-group">
                        <strong>{fmt(data.revenue)}</strong>
                        <small>{pct}%</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best Selling Products Card */}
            <div className="overview-panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">COLLECTION DEMAND</span>
                  <h3>Best-Selling Pieces</h3>
                </div>
              </div>

              {bestSellers.length === 0 ? (
                <p className="panel-empty-text">No order sales registered yet.</p>
              ) : (
                <div className="best-sellers-list">
                  {bestSellers.map((item, idx) => (
                    <div key={item.id} className="best-seller-row">
                      <span className="seller-rank">#{idx + 1}</span>
                      <img
                        src={item.image || FALLBACK}
                        alt={item.name}
                        className="seller-thumb"
                        onError={e => { e.currentTarget.src = FALLBACK; }}
                      />
                      <div className="seller-info">
                        <b>{item.name}</b>
                        <small>{item.category} · {item.remainingStock != null ? `${item.remainingStock} units left` : 'Stock not set'}</small>
                      </div>
                      <div className="seller-figures">
                        <b>{item.unitsSold} sold</b>
                        <strong>{fmt(item.revenue)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="overview-panel" style={{ marginTop: '24px' }}>
            <div className="panel-header">
              <div>
                <span className="eyebrow">ORDER FULFILLMENT</span>
                <h3>Recent Customer Orders</h3>
              </div>
              <button type="button" className="btn btn-outline admin-btn-sm" onClick={() => setTab('orders')}>
                View All Orders ({orders.length}) →
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.id} className="admin-table-row">
                      <td><b>{o.id}</b></td>
                      <td><small>{new Date(o.createdAt).toLocaleDateString()}</small></td>
                      <td>
                        <b>{o.customer?.name}</b>
                        <small style={{ display: 'block', color: 'var(--muted)' }}>{o.customer?.area}</small>
                      </td>
                      <td>
                        <span>{o.items?.length || 0} piece(s)</span>
                      </td>
                      <td><b>{fmt(o.total)}</b></td>
                      <td>
                        <select
                          value={o.status}
                          onChange={e => updateOrderStatus(o.id, e.target.value)}
                          className="status-selector-sm"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="text-btn"
                          onClick={() => setViewingOrder(o)}
                        >
                          Invoice Sheet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock & Out of Stock Alerts Table */}
          {(stockStats.lowStockProducts.length > 0 || stockStats.outOfStockProducts.length > 0) && (
            <div className="overview-panel alert-panel" style={{ marginTop: '24px' }}>
              <div className="panel-header">
                <div>
                  <span className="eyebrow" style={{ color: '#a34f4f' }}>INVENTORY ATTENTION</span>
                  <h3>Low-Stock & Depleted Inventory Alerts</h3>
                </div>
                <button type="button" className="btn btn-dark admin-btn-sm" onClick={() => setTab('inventory')}>
                  Open Stock Matrix →
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>Piece</th>
                      <th>Category</th>
                      <th>Available Units</th>
                      <th>Status Alert</th>
                      <th style={{ textAlign: 'right' }}>Replenish</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stockStats.outOfStockProducts, ...stockStats.lowStockProducts].slice(0, 8).map(p => (
                      <tr key={p.id}>
                        <td>
                          <b>{p.name}</b>
                          <small style={{ display: 'block', color: 'var(--muted)' }}>ID: {p.id}</small>
                        </td>
                        <td>{p.category}</td>
                        <td><b>{p.totalStock ?? 0} units</b></td>
                        <td>
                          {p.totalStock === 0 ? (
                            <span className="admin-status-badge out">Depleted (0)</span>
                          ) : (
                            <span className="admin-status-badge low">Critical ({p.totalStock})</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline admin-btn-sm"
                            onClick={() => {
                              // Replenish first color / sizes +5
                              if (p.sizes && p.sizes[0] && p.sizes[0].sizes) {
                                p.sizes[0].sizes.forEach(s => {
                                  adjustSizeStock(p.id, p.sizes[0].name, s.label, 5);
                                });
                              } else {
                                initPieceStock(p.id, 5);
                              }
                            }}
                          >
                            +5 Restock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ======================================================================
          SECTION 2: PRODUCTS CATALOG
         ====================================================================== */}
      {tab === 'products' && (
        <section className="admin-catalog-section">
          {/* Toolbar */}
          <div className="admin-catalog-toolbar">
            <div className="admin-filter-group">
              <label className="filter-search admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Filter pieces by name, ID or category..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </label>

              <label className="select-wrap admin-cat-select">
                <SlidersHorizontal size={14} />
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="select-wrap admin-cat-select">
                <Boxes size={14} />
                <select value={stockConditionFilter} onChange={e => setStockConditionFilter(e.target.value)}>
                  <option value="All">All Stock Levels</option>
                  <option value="in_stock">Healthy Stock</option>
                  <option value="low_stock">Low Stock (≤10)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                  <option value="not_set">Stock Not Set</option>
                </select>
              </label>

              <label className="select-wrap admin-cat-select">
                <select value={sortField} onChange={e => setSortField(e.target.value)}>
                  <option value="featured">Sort: Featured</option>
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="price-asc">Sort: Price (Low to High)</option>
                  <option value="price-desc">Sort: Price (High to Low)</option>
                  <option value="stock-desc">Sort: Highest Stock</option>
                  <option value="stock-asc">Sort: Lowest Stock</option>
                </select>
              </label>
            </div>

            <div className="admin-toolbar-right">
              <span className="admin-count-label">{filteredProducts.length} pieces shown</span>
              <button
                type="button"
                className="text-btn admin-reset-btn"
                title="Restore default VELORA catalog"
                onClick={() => {
                  if (window.confirm('Reset all product customizations back to the default catalog?')) {
                    resetProducts();
                  }
                }}
              >
                <RefreshCw size={13} /> Reset Catalog
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="admin-table-container">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Piece</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Color Variants</th>
                  <th>Total Units Available</th>
                  <th>Stock Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const resolved = resolveProductViews(p);
                  const colorCount = resolved.colors.length || 1;
                  const views = resolved.views;
                  const totalStock = getProductTotalStock(p);
                  const status = getProductStockStatus(p, storeSettings.lowStockThreshold);

                  return (
                    <tr key={p.id} className="admin-table-row">
                      <td className="admin-td-product">
                        <div className="admin-prod-thumb">
                          <img
                            src={views.front || p.image || FALLBACK}
                            alt={p.name}
                            onError={e => { e.currentTarget.src = FALLBACK; }}
                          />
                        </div>
                        <div className="admin-prod-info">
                          <b>{p.name}</b>
                          <small>ID: {p.id}</small>
                          {p.badge && <span className="admin-badge-pill">{p.badge}</span>}
                        </div>
                      </td>

                      <td>
                        <span className="admin-cat-pill">{p.category}</span>
                      </td>

                      <td>
                        <div className="admin-price-cell">
                          <b>{fmt(p.price)}</b>
                          {p.oldPrice && <del>{fmt(p.oldPrice)}</del>}
                        </div>
                      </td>

                      <td>
                        <div className="admin-colors-cell">
                          {resolved.colors.length > 0 ? (
                            resolved.colors.map(c => (
                              <span
                                key={c.name}
                                className="color-swatch-circle"
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))
                          ) : (
                            <span className="admin-color-single">Single color</span>
                          )}
                          <small>({colorCount} {colorCount === 1 ? 'variant' : 'variants'})</small>
                        </div>
                      </td>

                      <td>
                        <div className="admin-stock-num-cell">
                          {totalStock !== null ? (
                            <>
                              <strong className="stock-qty-num">{totalStock}</strong>
                              <small>units</small>
                            </>
                          ) : (
                            <span className="stock-not-set-label">Not set</span>
                          )}
                        </div>
                      </td>

                      <td>
                        {status === 'in_stock' && (
                          <span className="admin-status-badge in">In Stock</span>
                        )}
                        {status === 'low_stock' && (
                          <span className="admin-status-badge low">Low Stock</span>
                        )}
                        {status === 'out_of_stock' && (
                          <span className="admin-status-badge out">Out of Stock</span>
                        )}
                        {status === 'not_set' && (
                          <button
                            type="button"
                            className="admin-status-badge unset btn-unset-click"
                            onClick={() => initPieceStock(p.id, 5)}
                            title="Click to initialize stock to 5 units per size"
                          >
                            + Init Stock
                          </button>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn btn-outline admin-btn-sm"
                            onClick={() => handleOpenEdit(p)}
                            title="Edit piece and assign stock/views"
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <Link
                            to={`/product/${p.id}`}
                            className="icon-btn admin-view-link"
                            title="View on storefront"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            type="button"
                            className="icon-btn admin-delete-icon"
                            onClick={() => {
                              if (window.confirm(`Delete "${p.name}"?`)) {
                                handleDeleteProduct(p.id);
                              }
                            }}
                            title="Delete piece"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ======================================================================
          SECTION 3: INVENTORY DEDICATED STOCK MATRIX
         ====================================================================== */}
      {tab === 'inventory' && (
        <section className="admin-inventory-section">
          {/* Inventory Controls */}
          <div className="admin-catalog-toolbar">
            <div className="admin-filter-group">
              <label className="filter-search admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search pieces in stock matrix..."
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                />
              </label>

              <label className="select-wrap admin-cat-select">
                <SlidersHorizontal size={14} />
                <select value={inventoryCatFilter} onChange={e => setInventoryCatFilter(e.target.value)}>
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="select-wrap admin-cat-select">
                <Boxes size={14} />
                <select value={inventoryConditionFilter} onChange={e => setInventoryConditionFilter(e.target.value)}>
                  <option value="All">All Stock Levels</option>
                  <option value="in_stock">Healthy Stock (&gt;10)</option>
                  <option value="low_stock">Low Stock (≤10)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                  <option value="not_set">Stock Not Configured</option>
                </select>
              </label>
            </div>

            <div className="admin-toolbar-right">
              <span className="admin-count-label">
                Total Units in Matrix: <b>{stockStats.totalUnitsInStock}</b>
              </span>
            </div>
          </div>

          {/* Matrix Cards for Every Product */}
          <div className="inventory-cards-list">
            {filteredInventoryProducts.map(product => {
              const totalStock = getProductTotalStock(product);
              const isUnset = totalStock === null;

              return (
                <article key={product.id} className="inventory-product-card">
                  <div className="inv-card-header">
                    <div className="inv-card-prod-info">
                      <img
                        src={product.image || FALLBACK}
                        alt={product.name}
                        className="inv-thumb"
                        onError={e => { e.currentTarget.src = FALLBACK; }}
                      />
                      <div>
                        <h3>{product.name}</h3>
                        <div className="inv-sub-line">
                          <span>ID: {product.id}</span> · <span>{product.category}</span> · <b>{fmt(product.price)}</b>
                        </div>
                      </div>
                    </div>

                    <div className="inv-card-total-box">
                      <span className="eyebrow">TOTAL AVAILABLE UNITS</span>
                      <strong className={`inv-total-display ${totalStock === 0 ? 'zero' : totalStock <= 10 ? 'low' : ''}`}>
                        {totalStock !== null ? `${totalStock} units` : 'Not Set'}
                      </strong>
                      <small>Sum of variant quantities</small>
                    </div>
                  </div>

                  {/* If stock is unset */}
                  {isUnset ? (
                    <div className="inv-unset-callout">
                      <p>
                        Stock has not been configured for this piece yet. Click below to initialize standard variants and quantities.
                      </p>
                      <button
                        type="button"
                        className="btn btn-dark admin-btn-sm"
                        onClick={() => initPieceStock(product.id, 5)}
                      >
                        <Plus size={14} /> Initialize Stock (5 units per size)
                      </button>
                    </div>
                  ) : (
                    /* Real Multi-Variant Quantities Grid */
                    <div className="inv-variants-container">
                      {product.sizes?.map(colorGroup => (
                        <div key={colorGroup.name} className="inv-color-row">
                          <div className="inv-color-tag">
                            <span className="color-swatch-circle" style={{ backgroundColor: colorGroup.hex || '#24231f' }} />
                            <b>{colorGroup.name}</b>
                          </div>

                          <div className="inv-sizes-stock-grid">
                            {colorGroup.sizes?.map(sizeItem => (
                              <div key={sizeItem.label} className="inv-size-stepper-box">
                                <span className="inv-size-label">Size {sizeItem.label}</span>
                                <div className="inv-stepper">
                                  <button
                                    type="button"
                                    className="inv-step-btn"
                                    onClick={() => adjustSizeStock(product.id, colorGroup.name, sizeItem.label, -1)}
                                    disabled={sizeItem.stock <= 0}
                                    title="Decrease by 1"
                                  >
                                    <Minus size={11} />
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={sizeItem.stock}
                                    onChange={e => setSizeStock(product.id, colorGroup.name, sizeItem.label, e.target.value)}
                                    className={`inv-stock-input ${sizeItem.stock === 0 ? 'zero-stock' : sizeItem.stock <= 3 ? 'low-stock' : ''}`}
                                  />
                                  <button
                                    type="button"
                                    className="inv-step-btn"
                                    onClick={() => adjustSizeStock(product.id, colorGroup.name, sizeItem.label, 1)}
                                    title="Increase by 1"
                                  >
                                    <Plus size={11} />
                                  </button>
                                </div>
                                <span className="inv-stock-status-micro">
                                  {sizeItem.stock === 0 ? (
                                    <span style={{ color: '#a34f4f' }}>Sold out</span>
                                  ) : sizeItem.stock <= 3 ? (
                                    <span style={{ color: '#a78351' }}>Low ({sizeItem.stock})</span>
                                  ) : (
                                    <span>In stock</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="inv-card-footer">
                    <div className="inv-batch-actions">
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => {
                          if (product.sizes) {
                            product.sizes.forEach(c => {
                              c.sizes.forEach(s => adjustSizeStock(product.id, c.name, s.label, 5));
                            });
                          }
                        }}
                      >
                        + Add 5 to all variants
                      </button>
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => {
                          if (product.sizes) {
                            product.sizes.forEach(c => {
                              c.sizes.forEach(s => setSizeStock(product.id, c.name, s.label, 10));
                            });
                          }
                        }}
                      >
                        Set all variants to 10
                      </button>
                    </div>

                    <div className="inv-footer-right">
                      <Link to={`/product/${product.id}`} className="text-btn" target="_blank" rel="noreferrer">
                        View on Storefront →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================================
          SECTION 4: CATEGORIES MANAGEMENT
         ====================================================================== */}
      {tab === 'categories' && (
        <section className="admin-categories-section">
          <div className="admin-section-info-banner">
            <div>
              <h3>Category System & Subcategory Hierarchy</h3>
              <p>
                Add, manage, and synchronize subcategories. Changes are saved instantly and reflected in the storefront mega menu.
              </p>
            </div>
            <button
              type="button"
              className="text-btn admin-reset-btn"
              onClick={() => {
                if (window.confirm('Reset all categories back to default VELORA hierarchy?')) {
                  const reset = resetCategoryTree();
                  setCategoryTree({ ...reset });
                }
              }}
            >
              <RefreshCw size={13} /> Reset Categories
            </button>
          </div>

          {/* Department Selector Tabs */}
          <div className="admin-dept-tabs">
            {Object.keys(categoryTree).map(dept => (
              <button
                key={dept}
                type="button"
                className={`admin-dept-tab-btn ${selectedDept === dept ? 'active' : ''}`}
                onClick={() => setSelectedDept(dept)}
              >
                {dept} ({categoryTree[dept]?.length || 0} subcategories)
              </button>
            ))}
          </div>

          {/* Add Subcategory Form */}
          <form className="admin-add-subcat-form" onSubmit={handleAddSubcat}>
            <input
              type="text"
              placeholder={`Add new subcategory to ${selectedDept} (e.g. Loungewear, Silk Robes)...`}
              value={newSubcatName}
              onChange={e => setNewSubcatName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-dark admin-btn-sm">
              <Plus size={14} /> Add Subcategory
            </button>
          </form>

          {/* Subcategories Grid */}
          <div className="admin-subcat-grid">
            {(categoryTree[selectedDept] || []).map(sub => {
              // Count products matching this subcategory
              const count = products.filter(
                p =>
                  p.category === selectedDept &&
                  (p.subcategory?.toLowerCase() === sub.toLowerCase() ||
                    p.name.toLowerCase().includes(sub.toLowerCase()))
              ).length;

              return (
                <div key={sub} className="admin-subcat-card">
                  <div>
                    <b>{sub}</b>
                    <small>{count} matching piece(s)</small>
                  </div>
                  <button
                    type="button"
                    className="icon-btn del-subcat-icon"
                    onClick={() => handleRemoveSubcat(sub)}
                    title={`Remove "${sub}"`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================================
          SECTION 5: DEPARTMENTS MANAGEMENT
         ====================================================================== */}
      {tab === 'departments' && (
        <section className="admin-departments-section">
          <div className="admin-section-info-banner">
            <div>
              <h3>Store Departments</h3>
              <p>Manage top-level storefront divisions. Each department contains dedicated subcategories and curated collections.</p>
            </div>
          </div>

          {/* Add Department Form */}
          <form className="admin-add-subcat-form" onSubmit={handleAddDept}>
            <input
              type="text"
              placeholder="Add new department (e.g. Home, Beauty, Unisex, Haute Couture)..."
              value={newDeptName}
              onChange={e => setNewDeptName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-dark admin-btn-sm">
              <Plus size={14} /> Add Department
            </button>
          </form>

          {/* Department Cards */}
          <div className="admin-dept-cards-grid">
            {Object.keys(categoryTree).map(dept => {
              const deptProducts = products.filter(
                p => p.category?.toLowerCase() === dept.toLowerCase()
              );
              const subCount = (categoryTree[dept] || []).length;

              return (
                <article key={dept} className="admin-dept-card">
                  <div className="dept-card-header">
                    <h3>{dept}</h3>
                    <span className="admin-badge-pill">{deptProducts.length} Pieces</span>
                  </div>
                  <p className="dept-card-meta">
                    Includes <b>{subCount}</b> organized subcategories.
                  </p>
                  <div className="dept-subs-sample">
                    {(categoryTree[dept] || []).slice(0, 6).map(s => (
                      <span key={s} className="dept-sub-chip">{s}</span>
                    ))}
                    {subCount > 6 && <span className="dept-sub-more">+{subCount - 6} more</span>}
                  </div>
                  <div className="dept-card-footer">
                    <Link
                      to={dept.toLowerCase() === 'women' ? '/women' : dept.toLowerCase() === 'men' ? '/men' : dept.toLowerCase() === 'kids' ? '/kids' : `/category/${dept.toLowerCase()}`}
                      className="text-btn"
                      target="_blank"
                    >
                      View on Storefront →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================================
          SECTION 6: ORDERS MANAGEMENT
         ====================================================================== */}
      {tab === 'orders' && (
        <section className="admin-orders-section">
          {/* Orders Toolbar */}
          <div className="admin-catalog-toolbar">
            <div className="admin-filter-group">
              <label className="filter-search admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by Order Ref, Client name, phone or email..."
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                />
              </label>

              <label className="select-wrap admin-cat-select">
                <SlidersHorizontal size={14} />
                <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}>
                  <option value="All">All Statuses ({orders.length})</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>

            <div className="admin-toolbar-right">
              <button
                type="button"
                className="text-btn admin-reset-btn"
                onClick={() => {
                  if (window.confirm('Reset orders to demonstration seed records?')) {
                    resetOrders();
                  }
                }}
              >
                <RefreshCw size={13} /> Reset Demo Orders
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="admin-table-container">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Date & Time</th>
                  <th>Customer Information</th>
                  <th>Pieces Ordered</th>
                  <th>Payment & Logistics</th>
                  <th>Total</th>
                  <th>Fulfillment Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.id} className="admin-table-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b>{o.id}</b>
                        {o.isDemo && (
                          <span style={{ fontSize: '9px', padding: '1px 5px', background: 'var(--soft)', color: 'var(--muted)', borderRadius: '2px', border: '1px solid var(--line)', textTransform: 'uppercase' }}>
                            Demo
                          </span>
                        )}
                      </div>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>
                        {o.trackingNumber || 'Tracking Pending'}
                      </small>
                    </td>

                    <td>
                      <small>{new Date(o.createdAt).toLocaleString()}</small>
                    </td>

                    <td>
                      <b>{o.customer?.name}</b>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>
                        {o.customer?.phone} · {o.customer?.email}
                      </small>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>
                        {o.customer?.address}, {o.customer?.area}
                      </small>
                    </td>

                    <td>
                      <div className="admin-order-items-compact">
                        {o.items?.map((it, idx) => (
                          <div key={idx} className="order-item-compact-line">
                            <span>{it.name} ({it.color ? `${it.color} · ` : ''}{it.size}) × {it.qty}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td>
                      <span>{o.method === 'cod' ? 'Cash on Delivery' : o.method === 'wallet' ? 'InstaPay / Wallet' : 'Card'}</span>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>{o.carrier || 'White Glove'}</small>
                    </td>

                    <td>
                      <b>{fmt(o.total)}</b>
                      {o.discount > 0 && <small style={{ display: 'block', color: '#56835e' }}>Discount: -{fmt(o.discount)}</small>}
                    </td>

                    <td>
                      <select
                        value={o.status}
                        onChange={e => updateOrderStatus(o.id, e.target.value)}
                        className={`admin-status-dropdown status-${o.status?.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline admin-btn-sm"
                        onClick={() => setViewingOrder(o)}
                      >
                        <Eye size={13} /> View Sheet
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ======================================================================
          SECTION 7: CUSTOMERS DIRECTORY
         ====================================================================== */}
      {tab === 'customers' && (
        <section className="admin-customers-section">
          <div className="admin-section-info-banner">
            <div>
              <h3>Clientele Directory</h3>
              <p>All authenticated and guest clients aggregated from completed order records.</p>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Contact Email</th>
                  <th>Mobile Phone</th>
                  <th>Primary Delivery Location</th>
                  <th>Total Orders</th>
                  <th>Lifetime Spend</th>
                  <th>Last Transaction</th>
                </tr>
              </thead>
              <tbody>
                {customersList.map((client, idx) => (
                  <tr key={idx} className="admin-table-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b>{client.name}</b>
                        {client.isDemo && (
                          <span style={{ fontSize: '9px', padding: '1px 5px', background: 'var(--soft)', color: 'var(--muted)', borderRadius: '2px', border: '1px solid var(--line)', textTransform: 'uppercase' }}>
                            Demo Client
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{client.email}</td>
                    <td>{client.phone}</td>
                    <td>
                      <span>{client.area}</span>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>{client.address}</small>
                    </td>
                    <td><b>{client.ordersCount}</b></td>
                    <td><strong>{fmt(client.totalSpent)}</strong></td>
                    <td><small>{new Date(client.lastOrderDate).toLocaleDateString()}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ======================================================================
          SECTION 8: DISCOUNTS AND PROMOTIONS
         ====================================================================== */}
      {tab === 'promotions' && (
        <section className="admin-promotions-section">
          <div className="admin-section-info-banner">
            <div>
              <h3>Discounts, Gift Codes & Seasonal Promotions</h3>
              <p>Create promotional vouchers and percentage reductions that apply automatically in Cart and Checkout.</p>
            </div>
            <button
              type="button"
              className="btn btn-dark admin-btn-sm"
              onClick={() => setShowNewPromoForm(true)}
            >
              <Plus size={14} /> Create Promo Code
            </button>
          </div>

          {/* Add Promo Code Drawer */}
          {showNewPromoForm && (
            <form className="admin-new-promo-drawer" onSubmit={handleAddPromo}>
              <h4>Add New Promotional Code</h4>
              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Coupon Code *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRIVATE25"
                    value={newPromo.code}
                    onChange={e => setNewPromo({ ...newPromo, code: e.target.value })}
                  />
                </label>

                <label className="admin-field">
                  <span>Discount Type</span>
                  <select
                    value={newPromo.type}
                    onChange={e => setNewPromo({ ...newPromo, type: e.target.value })}
                  >
                    <option value="percent">Percentage Off (%)</option>
                    <option value="fixed">Fixed Reduction ($ USD base)</option>
                  </select>
                </label>

                <label className="admin-field">
                  <span>Discount Value *</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPromo.value}
                    onChange={e => setNewPromo({ ...newPromo, value: e.target.value })}
                  />
                </label>

                <label className="admin-field">
                  <span>Min Spend Required ($)</span>
                  <input
                    type="number"
                    min="0"
                    value={newPromo.minSpend}
                    onChange={e => setNewPromo({ ...newPromo, minSpend: e.target.value })}
                  />
                </label>
              </div>

              <label className="admin-field" style={{ marginTop: '12px' }}>
                <span>Editorial Description</span>
                <input
                  type="text"
                  placeholder="e.g. Seasonal 15% reduction for VIP clients"
                  value={newPromo.description}
                  onChange={e => setNewPromo({ ...newPromo, description: e.target.value })}
                />
              </label>

              <div className="admin-promo-actions">
                <button type="submit" className="btn btn-dark admin-btn-sm">
                  Save Coupon
                </button>
                <button
                  type="button"
                  className="btn btn-outline admin-btn-sm"
                  onClick={() => setShowNewPromoForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Promo Codes List */}
          <div className="admin-table-container">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Reduction</th>
                  <th>Min Spend</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map(promo => (
                  <tr key={promo.code} className="admin-table-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b className="promo-code-badge">{promo.code}</b>
                        {promo.isDemo && (
                          <span style={{ fontSize: '9px', padding: '1px 5px', background: 'var(--soft)', color: 'var(--muted)', borderRadius: '2px', border: '1px solid var(--line)', textTransform: 'uppercase' }}>
                            Demo Code
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{promo.type === 'percent' ? `${promo.value}%` : fmt(promo.value)}</strong>
                    </td>
                    <td>{promo.minSpend ? fmt(promo.minSpend) : 'No Minimum'}</td>
                    <td>{promo.description}</td>
                    <td>
                      <span className={`admin-status-badge ${promo.active ? 'in' : 'out'}`}>
                        {promo.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="btn btn-outline admin-btn-sm"
                          onClick={() => handleTogglePromo(promo.code)}
                        >
                          {promo.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="icon-btn admin-delete-icon"
                          onClick={() => handleDeletePromo(promo.code)}
                          title="Delete promotion"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ======================================================================
          SECTION 9: IMAGE MANAGEMENT (4-VIEW COVERAGE)
         ====================================================================== */}
      {tab === 'images' && (
        <section className="admin-images-section">
          <div className="admin-catalog-toolbar">
            <div className="admin-filter-group">
              <label className="select-wrap admin-cat-select">
                <SlidersHorizontal size={14} />
                <select value={imageCatFilter} onChange={e => setImageCatFilter(e.target.value)}>
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="checkbox-row" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={imageMissingOnly}
                  onChange={e => setImageMissingOnly(e.target.checked)}
                />
                <span style={{ fontSize: '11px' }}>Show only pieces with missing views</span>
              </label>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Piece</th>
                  <th>Category</th>
                  <th>Front View</th>
                  <th>Back View</th>
                  <th>Side View</th>
                  <th>Detail View</th>
                  <th style={{ textAlign: 'right' }}>Edit Views</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .filter(p => {
                    const matchCat = imageCatFilter === 'All' || p.category === imageCatFilter;
                    if (!imageMissingOnly) return matchCat;
                    const res = resolveProductViews(p);
                    const missing = VIEW_KEYS.some(k => !res.views[k]);
                    return matchCat && missing;
                  })
                  .map(p => {
                    const resolved = resolveProductViews(p);
                    const views = resolved.views;

                    return (
                      <tr key={p.id} className="admin-table-row">
                        <td className="admin-td-product">
                          <div className="admin-prod-thumb">
                            <img src={views.front || p.image || FALLBACK} alt={p.name} />
                          </div>
                          <div>
                            <b>{p.name}</b>
                            <small style={{ display: 'block', color: 'var(--muted)' }}>ID: {p.id}</small>
                          </div>
                        </td>

                        <td>{p.category}</td>

                        {VIEW_KEYS.map(k => (
                          <td key={k}>
                            {views[k] ? (
                              <span className="view-check-pill ready">
                                <Check size={11} /> {k}
                              </span>
                            ) : (
                              <span className="view-check-pill missing">Missing</span>
                            )}
                          </td>
                        ))}

                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline admin-btn-sm"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Edit3 size={13} /> Update Photos
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ======================================================================
          SECTION 10: SETTINGS & DISCLOSURE
         ====================================================================== */}
      {tab === 'settings' && (
        <section className="admin-settings-section">
          <div className="admin-section-info-banner">
            <div>
              <h3>Maison Global Settings & Operations</h3>
              <p>Configure store profile, regional pricing thresholds, inventory rules, and demo data.</p>
            </div>
          </div>

          <form
            className="admin-settings-form"
            onSubmit={e => {
              e.preventDefault();
              setSettingsSaved(true);
              setTimeout(() => setSettingsSaved(false), 3000);
            }}
          >
            {settingsSaved && (
              <div className="form-success" style={{ marginBottom: 20 }}>
                <CheckCircle2 size={16} /> Store settings updated successfully.
              </div>
            )}

            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Storefront Brand Title</span>
                <input
                  type="text"
                  value={storeSettings.storeName}
                  onChange={e => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                />
              </label>

              <label className="admin-field">
                <span>Maison Slogan</span>
                <input
                  type="text"
                  value={storeSettings.slogan}
                  onChange={e => setStoreSettings({ ...storeSettings, slogan: e.target.value })}
                />
              </label>

              <label className="admin-field">
                <span>Concierge Email</span>
                <input
                  type="email"
                  value={storeSettings.contactEmail}
                  onChange={e => setStoreSettings({ ...storeSettings, contactEmail: e.target.value })}
                />
              </label>

              <label className="admin-field">
                <span>Support Mobile / Hotline</span>
                <input
                  type="text"
                  value={storeSettings.contactPhone}
                  onChange={e => setStoreSettings({ ...storeSettings, contactPhone: e.target.value })}
                />
              </label>

              <label className="admin-field">
                <span>Low-Stock Warning Threshold (Units)</span>
                <input
                  type="number"
                  min="1"
                  value={storeSettings.lowStockThreshold}
                  onChange={e => setStoreSettings({ ...storeSettings, lowStockThreshold: parseInt(e.target.value, 10) || 5 })}
                />
              </label>

              <label className="admin-field">
                <span>Free Delivery Minimum Spend (EGP)</span>
                <input
                  type="number"
                  min="0"
                  value={storeSettings.freeShippingThreshold}
                  onChange={e => setStoreSettings({ ...storeSettings, freeShippingThreshold: parseInt(e.target.value, 10) || 2000 })}
                />
              </label>
            </div>

            <button type="submit" className="btn btn-dark" style={{ marginTop: '20px' }}>
              Save Operational Settings
            </button>
          </form>

          {/* Technical Disclosure Box */}
          <div className="admin-disclosure-card">
            <h4>
              <ShieldCheck size={18} /> Technical Architecture & Environment Disclosure
            </h4>
            <p>
              This deployment represents a high-fidelity front-end demonstration of VELORA. All catalogs, multi-variant stock quantities, order records, and promo codes are synchronized via persistent browser storage (localStorage) and Firestore when credentials are provided.
            </p>
            <p>
              <strong>Notice:</strong> A front-end only demo does not provide secure multi-user production authentication or a shared server-side inventory locking mechanism. For multi-tenant production operations, connect to an enterprise backend with server-side transactions.
            </p>
          </div>

          {/* Demonstration Data Management */}
          <div className="admin-danger-zone">
            <h4>Demonstration Data Management</h4>
            <div className="danger-zone-btns">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  if (window.confirm('Reset product catalog to default?')) resetProducts();
                }}
              >
                Reset Products Catalog
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  if (window.confirm('Reset orders to demo state?')) resetOrders();
                }}
              >
                Reset Demo Orders
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  if (window.confirm('Reset categories?')) {
                    const r = resetCategoryTree();
                    setCategoryTree({ ...r });
                  }
                }}
              >
                Reset Categories
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  if (window.confirm('Reset promotional codes?')) {
                    const p = resetPromotions();
                    setPromotions([...p]);
                  }
                }}
              >
                Reset Promo Codes
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Invoice / Order Sheet Modal */}
      {viewingOrder && (
        <div className="admin-modal-backdrop" onClick={() => setViewingOrder(null)} role="dialog">
          <div className="admin-modal-card invoice-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span className="eyebrow">ORDER INVOICE SHEET</span>
                <h2>{viewingOrder.id}</h2>
                <small>Placed on {new Date(viewingOrder.createdAt).toLocaleString()}</small>
              </div>
              <button type="button" className="icon-btn" onClick={() => setViewingOrder(null)}>
                <XCircle size={20} />
              </button>
            </div>

            <div className="invoice-modal-content">
              <div className="invoice-cust-row">
                <div>
                  <b>Billed & Shipped To:</b>
                  <p>
                    {viewingOrder.customer?.name}<br />
                    {viewingOrder.customer?.phone} · {viewingOrder.customer?.email}<br />
                    {viewingOrder.customer?.address}, {viewingOrder.customer?.area}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b>Logistics Partner:</b>
                  <p>
                    {viewingOrder.carrier || 'Aramex Premier'}<br />
                    Waybill: <code>{viewingOrder.trackingNumber || 'Pending'}</code><br />
                    Payment: <b>{viewingOrder.method === 'cod' ? 'Cash on Delivery' : viewingOrder.method === 'wallet' ? 'InstaPay' : 'Card'}</b>
                  </p>
                </div>
              </div>

              <table className="admin-products-table" style={{ margin: '20px 0' }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Variant</th>
                    <th>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingOrder.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td><b>{it.name}</b></td>
                      <td>{it.color || 'Standard'} / Size {it.size || 'One Size'}</td>
                      <td>{it.qty}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(it.price)}</td>
                      <td style={{ textAlign: 'right' }}><b>{fmt(it.price * it.qty)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-totals-strip">
                <div><span>Subtotal:</span> <b>{fmt(viewingOrder.subtotal || viewingOrder.total)}</b></div>
                {viewingOrder.discount > 0 && <div><span>Coupon Discount:</span> <b>-{fmt(viewingOrder.discount)}</b></div>}
                <div><span>Delivery:</span> <b>{viewingOrder.shipping ? fmt(viewingOrder.shipping) : 'Free'}</b></div>
                <div className="invoice-grand-total"><span>Grand Total:</span> <strong>{fmt(viewingOrder.total)}</strong></div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <div />
              <button type="button" className="btn btn-dark admin-btn-sm" onClick={() => setViewingOrder(null)}>
                Close Invoice Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
        />
      )}
    </main>
  );
}
