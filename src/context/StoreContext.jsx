import { formatMoney } from '../utils/format';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { products as defaultProducts } from '../data/products';
import {
  getProductTotalStock,
  getVariantStock,
  isVariantAvailable,
  getProductStockStatus,
  getProductVariantMatrix,
  setProductVariantStock,
  adjustProductVariantStock,
  initProductStock,
  deductOrderStockFromCatalog,
  computeCatalogStockStats,
} from '../utils/inventory';
import { getAllOrders, saveOrder, updateStatus as updateRemoteStatus, resetOrdersToSeed } from '../utils/orders';
import { validatePromotion } from '../utils/promotions';

const StoreContext = createContext(null);

const lineKey = (id, size, color) => `${id}|${size || ''}|${color || ''}`;

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => {
    const saved = readJSON('velora-products-v2', null);
    if (!saved || !Array.isArray(saved) || saved.length === 0) return defaultProducts;
    // Ensure all default products are present, plus any custom user products
    const savedIds = new Set(saved.map(p => p.id));
    const missingDefaults = defaultProducts.filter(p => !savedIds.has(p.id));
    return [...saved, ...missingDefaults];
  });

  const [cart, setCart] = useState(() =>
    readJSON('velora-cart', []).map(i => ({ ...i, key: i.key || lineKey(i.id, i.size, i.color) }))
  );
  const [wishlist, setWishlist] = useState(() => readJSON('velora-wishlist', []));
  const [dark, setDark] = useState(() => localStorage.getItem('velora-theme-v2') === 'dark');
  const [toast, setToast] = useState('');
  const [currency, setCurrency] = useState(() => localStorage.getItem('velora-currency') || 'EGP');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Promotions & Discounts state
  const [appliedPromo, setAppliedPromo] = useState(() => readJSON('velora-applied-promo', null));

  // Sync orders on load
  const reloadOrders = useCallback(async () => {
    try {
      const list = await getAllOrders();
      setOrders(list);
    } catch (err) {
      console.warn('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadOrders();
  }, [reloadOrders]);

  useEffect(() => {
    localStorage.setItem('velora-currency', currency);
  }, [currency]);

  const fmt = usd => formatMoney(usd, currency);

  useEffect(() => {
    localStorage.setItem('velora-products-v2', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('velora-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('velora-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('velora-applied-promo', JSON.stringify(appliedPromo));
  }, [appliedPromo]);

  useEffect(() => {
    localStorage.setItem('velora-theme-v2', dark ? 'dark' : 'light');
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Cart operations with stock check
  const add = (product, size = '', color = '', customImage = null) => {
    // Check if stock is unconfigured
    const totalStock = getProductTotalStock(product);
    if (totalStock === null) {
      setToast(`Apologies, ${product.name} is currently unavailable (stock not set).`);
      return false;
    }

    // Check variant stock if defined
    const available = isVariantAvailable(product, color, size);
    if (!available) {
      setToast(`Apologies, ${product.name} is out of stock in this selection.`);
      return false;
    }

    const key = lineKey(product.id, size, color);
    const itemImage = customImage || product.image;
    setCart(current =>
      current.some(i => i.key === key)
        ? current.map(i => (i.key === key ? { ...i, qty: i.qty + 1 } : i))
        : [...current, { ...product, image: itemImage, size, color, key, qty: 1 }]
    );
    const colorLabel = color ? ` · ${color}` : '';
    const sizeLabel = size ? ` (${size})` : '';
    setToast(`${product.name}${colorLabel}${sizeLabel} added to your bag`);
    return true;
  };

  const change = (key, delta) =>
    setCart(current =>
      current.map(i => (i.key === key ? { ...i, qty: i.qty + delta } : i)).filter(i => i.qty > 0)
    );

  const clearCart = () => setCart([]);
  const remove = key => setCart(current => current.filter(i => i.key !== key));

  const toggleWish = product => {
    const saved = wishlist.includes(product.id);
    setWishlist(current => (saved ? current.filter(id => id !== product.id) : [...current, product.id]));
    setToast(saved ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  // Product CRUD
  const addProduct = newProduct => {
    const p = {
      ...newProduct,
      id: newProduct.id || `custom-${Date.now()}`,
      price: Number(newProduct.price) || 0,
      oldPrice: newProduct.oldPrice ? Number(newProduct.oldPrice) : null,
      sizes: newProduct.sizes || [],
    };
    setProducts(current => [p, ...current]);
    setToast(`Piece "${p.name}" added to catalog`);
    return p;
  };

  const updateProduct = (id, updatedFields) => {
    setProducts(current =>
      current.map(p => (p.id === id ? { ...p, ...updatedFields } : p))
    );
    setToast('Product details updated successfully');
  };

  const deleteProduct = id => {
    setProducts(current => current.filter(p => p.id !== id));
    setToast('Piece removed from catalog');
  };

  const resetProducts = () => {
    localStorage.removeItem('velora-products-v2');
    setProducts(defaultProducts);
    setToast('Product catalog restored to original state');
  };

  // Inventory / Stock management
  const setSizeStock = (productId, colorName, sizeLabel, stock) => {
    setProducts(current =>
      current.map(p => {
        if (p.id !== productId) return p;
        return setProductVariantStock(p, colorName, sizeLabel, stock);
      })
    );
  };

  const adjustSizeStock = (productId, colorName, sizeLabel, delta) => {
    setProducts(current =>
      current.map(p => {
        if (p.id !== productId) return p;
        return adjustProductVariantStock(p, colorName, sizeLabel, delta);
      })
    );
  };

  const initPieceStock = (productId, initialQty = 5) => {
    setProducts(current =>
      current.map(p => {
        if (p.id !== productId) return p;
        return initProductStock(p, initialQty);
      })
    );
    setToast('Stock structure initialized for piece');
  };

  // Stock deduction upon order placement
  const deductOrderStock = orderItems => {
    setProducts(current => deductOrderStockFromCatalog(current, orderItems));
  };

  // Order management
  const addNewOrder = async (uid, orderData) => {
    const saved = await saveOrder(uid, orderData);
    setOrders(list => [saved, ...list.filter(o => o.id !== saved.id)]);
    // Automatically deduct stock for ordered items
    if (Array.isArray(orderData.items)) {
      deductOrderStock(orderData.items);
    }
    return saved;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const updated = await updateRemoteStatus(orderId, newStatus);
    setOrders(list => list.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
    setToast(`Order ${orderId} updated to "${newStatus}"`);
    return updated;
  };

  const resetOrders = () => {
    const seeded = resetOrdersToSeed();
    setOrders(seeded);
    setToast('Orders reset to demonstration records');
  };

  // Promotions & Discounts
  const applyPromo = (code, subtotal) => {
    const res = validatePromotion(code, subtotal);
    if (!res.valid) {
      setToast(res.message);
      return false;
    }
    setAppliedPromo(res);
    setToast(res.message);
    return true;
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setToast('Promotion removed');
  };

  // Catalog stock statistics helper
  const stockStats = computeCatalogStockStats(products);

  return (
    <StoreContext.Provider
      value={{
        currency,
        setCurrency,
        fmt,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        resetProducts,
        cart,
        wishlist,
        dark,
        setDark,
        add,
        change,
        remove,
        clearCart,
        toggleWish,
        // Inventory
        getProductTotalStock,
        getVariantStock,
        isVariantAvailable,
        getProductStockStatus,
        getProductVariantMatrix,
        setSizeStock,
        adjustSizeStock,
        initPieceStock,
        deductOrderStock,
        stockStats,
        // Orders
        orders,
        ordersLoading,
        reloadOrders,
        addNewOrder,
        updateOrderStatus,
        resetOrders,
        // Promotions
        appliedPromo,
        applyPromo,
        removePromo,
        // UI
        toast,
        setToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}
