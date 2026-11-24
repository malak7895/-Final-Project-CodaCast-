// VELORA Inventory & Multi-Variant Stock Engine
// Tracks real physical units by Product, Color, and Size.
// Total available stock is calculated strictly from actual variant quantities.

import { sizeOptions } from './sizing.js';

/**
 * Calculates the exact total available units in stock for a product.
 * Returns null if the product has no stock structure configured.
 */
export function getProductTotalStock(product) {
  if (!product || !Array.isArray(product.sizes) || product.sizes.length === 0) {
    return null;
  }

  let total = 0;
  let hasNumbers = false;

  for (const colorGroup of product.sizes) {
    if (Array.isArray(colorGroup.sizes)) {
      for (const sizeItem of colorGroup.sizes) {
        if (typeof sizeItem.stock === 'number') {
          total += Math.max(0, sizeItem.stock);
          hasNumbers = true;
        }
      }
    }
  }

  return hasNumbers ? total : null;
}

/**
 * Retrieves the available quantity for a specific color variant and size.
 * Returns null if the variant is not defined.
 */
export function getVariantStock(product, colorName, sizeLabel) {
  if (!product || !Array.isArray(product.sizes) || product.sizes.length === 0) {
    return null;
  }

  // Find matching color variant or fallback to first color
  let colorGroup = null;
  if (colorName) {
    colorGroup = product.sizes.find(
      c => c.name?.toLowerCase().trim() === colorName.toLowerCase().trim()
    );
  }
  if (!colorGroup && product.sizes.length > 0) {
    colorGroup = product.sizes[0];
  }
  if (!colorGroup || !Array.isArray(colorGroup.sizes)) {
    return null;
  }

  // Find size by label
  if (!sizeLabel) {
    // If no size requested (e.g. One Size piece), sum all sizes or check first
    if (colorGroup.sizes.length === 1) {
      return typeof colorGroup.sizes[0].stock === 'number' ? colorGroup.sizes[0].stock : null;
    }
    return null;
  }

  const sizeItem = colorGroup.sizes.find(
    s => String(s.label).toLowerCase().trim() === String(sizeLabel).toLowerCase().trim()
  );

  return sizeItem && typeof sizeItem.stock === 'number' ? sizeItem.stock : null;
}

/**
 * Checks if a specific variant is in stock (> 0).
 */
export function isVariantAvailable(product, colorName, sizeLabel) {
  const stock = getVariantStock(product, colorName, sizeLabel);
  if (stock === null) {
    // If stock is not configured, do not permit purchase
    const total = getProductTotalStock(product);
    return total === null ? false : total > 0;
  }
  return stock > 0;
}

/**
 * Classifies product stock status:
 * - 'not_set': stock not configured
 * - 'out_of_stock': total units === 0
 * - 'low_stock': 0 < total units <= threshold or any variant <= 3
 * - 'in_stock': healthy stock
 */
export function getProductStockStatus(product, lowStockThreshold = 10) {
  const total = getProductTotalStock(product);
  if (total === null) {
    return 'not_set';
  }
  if (total === 0) {
    return 'out_of_stock';
  }
  if (total <= lowStockThreshold) {
    return 'low_stock';
  }
  return 'in_stock';
}

/**
 * Returns an array of variant breakdown items for a product:
 * [{ colorName, colorHex, sizeLabel, stock }]
 */
export function getProductVariantMatrix(product) {
  if (!product || !Array.isArray(product.sizes)) return [];
  const matrix = [];
  product.sizes.forEach(c => {
    const colorName = c.name || 'Default';
    const colorHex = c.hex || '#24231f';
    if (Array.isArray(c.sizes)) {
      c.sizes.forEach(s => {
        matrix.push({
          productId: product.id,
          productName: product.name,
          colorName,
          colorHex,
          sizeLabel: s.label,
          stock: typeof s.stock === 'number' ? s.stock : 0,
        });
      });
    }
  });
  return matrix;
}

/**
 * Returns updated product with new stock for a given color & size.
 * Stock is guaranteed never to drop below 0.
 */
export function setProductVariantStock(product, colorName, sizeLabel, newStock) {
  const safeStock = Math.max(0, Math.floor(Number(newStock) || 0));
  if (!product) return product;

  const currentSizes = Array.isArray(product.sizes) ? [...product.sizes] : [];

  // If no sizes exist yet, create initial color group
  if (currentSizes.length === 0) {
    const defaultColor = colorName || 'Default';
    return {
      ...product,
      sizes: [
        {
          name: defaultColor,
          hex: '#24231f',
          sizes: [{ label: sizeLabel || 'One Size', stock: safeStock }],
        },
      ],
    };
  }

  // Update existing color group or add color
  let colorFound = false;
  const updatedColors = currentSizes.map(c => {
    const matchesColor = !colorName || c.name?.toLowerCase().trim() === colorName.toLowerCase().trim();
    if (!matchesColor) return c;
    colorFound = true;

    const currentSizeList = Array.isArray(c.sizes) ? [...c.sizes] : [];
    let sizeFound = false;
    const updatedSizeList = currentSizeList.map(s => {
      if (String(s.label).toLowerCase().trim() === String(sizeLabel).toLowerCase().trim()) {
        sizeFound = true;
        return { ...s, stock: safeStock };
      }
      return s;
    });

    if (!sizeFound) {
      updatedSizeList.push({ label: sizeLabel, stock: safeStock });
    }

    return { ...c, sizes: updatedSizeList };
  });

  if (!colorFound && colorName) {
    updatedColors.push({
      name: colorName,
      hex: '#24231f',
      sizes: [{ label: sizeLabel || 'One Size', stock: safeStock }],
    });
  }

  return { ...product, sizes: updatedColors };
}

/**
 * Adjusts variant stock by delta (+1, -1, +5, etc.) without allowing negative inventory.
 */
export function adjustProductVariantStock(product, colorName, sizeLabel, delta) {
  const current = getVariantStock(product, colorName, sizeLabel) ?? 0;
  const target = Math.max(0, current + delta);
  return setProductVariantStock(product, colorName, sizeLabel, target);
}

/**
 * Initializes variant stock structure for an unconfigured product.
 */
export function initProductStock(product, initialQty = 5) {
  if (!product) return product;
  const availableSizes = sizeOptions(product);
  const labels = availableSizes.length > 0 ? availableSizes : ['One Size'];

  // Default color variants if not defined
  const colors = (product.colors && product.colors.length > 0)
    ? product.colors.map(c => ({ name: c.name, hex: c.hex || '#24231f' }))
    : [{ name: 'Noir Black', hex: '#1f1f1d' }, { name: 'Camel Dune', hex: '#b89569' }];

  const sizes = colors.map(c => ({
    name: c.name,
    hex: c.hex,
    sizes: labels.map(label => ({
      label,
      stock: initialQty,
    })),
  }));

  return {
    ...product,
    sizes,
  };
}

/**
 * Deducts ordered items from catalog products.
 * Does not allow negative inventory.
 */
export function deductOrderStockFromCatalog(products, orderItems) {
  if (!Array.isArray(products) || !Array.isArray(orderItems)) return products;

  let updatedProducts = [...products];

  for (const item of orderItems) {
    const { id, color, size, qty } = item;
    const pIndex = updatedProducts.findIndex(p => p.id === id);
    if (pIndex !== -1) {
      const p = updatedProducts[pIndex];
      const currentStock = getVariantStock(p, color, size);
      if (currentStock !== null) {
        const remaining = Math.max(0, currentStock - (qty || 1));
        const updatedP = setProductVariantStock(p, color, size, remaining);
        updatedProducts[pIndex] = updatedP;
      }
    }
  }

  return updatedProducts;
}

/**
 * Computes high-level stock statistics across the entire catalog.
 */
export function computeCatalogStockStats(products, lowStockThreshold = 10) {
  if (!Array.isArray(products)) {
    return {
      totalProducts: 0,
      totalUnitsInStock: 0,
      inStockCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      notSetCount: 0,
      lowStockProducts: [],
      outOfStockProducts: [],
    };
  }

  let totalUnitsInStock = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let notSetCount = 0;

  const lowStockProducts = [];
  const outOfStockProducts = [];

  products.forEach(p => {
    const total = getProductTotalStock(p);
    if (total === null) {
      notSetCount++;
      return;
    }

    totalUnitsInStock += total;

    if (total === 0) {
      outOfStockCount++;
      outOfStockProducts.push({ ...p, totalStock: 0 });
    } else if (total <= lowStockThreshold) {
      lowStockCount++;
      lowStockProducts.push({ ...p, totalStock: total });
    } else {
      // Check if any individual variant is critically low (<= 3)
      const matrix = getProductVariantMatrix(p);
      const hasCriticalVariant = matrix.some(m => m.stock > 0 && m.stock <= 3);
      if (hasCriticalVariant) {
        lowStockCount++;
        lowStockProducts.push({ ...p, totalStock: total, hasCriticalVariant: true });
      } else {
        inStockCount++;
      }
    }
  });

  return {
    totalProducts: products.length,
    totalUnitsInStock,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    notSetCount,
    lowStockProducts,
    outOfStockProducts,
  };
}
