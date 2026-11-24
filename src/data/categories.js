// VELORA Comprehensive Expandable Category System
// Allows adding new departments and subcategories dynamically from the Admin Dashboard

export const DEFAULT_CATEGORY_TREE = {
  Women: [
    'Dresses',
    'Evening Dresses',
    'Casual Dresses',
    'Jeans',
    'Trousers',
    'Tops & Blouses',
    'Shirts',
    'T-Shirts',
    'Skirts',
    'Pajamas & Sleepwear',
    'Knitwear',
    'Jackets & Coats',
    'Shoes',
    'Bags',
    'Accessories',
  ],
  Men: [
    'Shirts',
    'T-Shirts & Polos',
    'Jeans',
    'Trousers',
    'Hoodies',
    'Pajamas',
    'Jackets',
    'Suits',
    'Shoes',
    'Accessories',
  ],
  Kids: [
    'Girls',
    'Boys',
    'Baby',
    'Dresses',
    'Tops',
    'Sets',
    'Jeans',
    'Pajamas',
    'Shoes',
    'Accessories',
  ],
};

// Curated mega-menu column groupings for structured luxury presentation
export const MEGA_MENU_GROUPS = {
  Women: [
    {
      heading: 'Dresses & Loungewear',
      items: ['Dresses', 'Evening Dresses', 'Casual Dresses', 'Pajamas & Sleepwear'],
    },
    {
      heading: 'Tops & Knitwear',
      items: ['Tops & Blouses', 'Shirts', 'T-Shirts', 'Knitwear'],
    },
    {
      heading: 'Tailoring & Bottoms',
      items: ['Jackets & Coats', 'Trousers', 'Jeans', 'Skirts'],
    },
    {
      heading: 'Shoes & Accessories',
      items: ['Shoes', 'Bags', 'Accessories'],
    },
  ],
  Men: [
    {
      heading: 'Shirts & Tops',
      items: ['Shirts', 'T-Shirts & Polos', 'Hoodies', 'Pajamas'],
    },
    {
      heading: 'Tailoring & Denim',
      items: ['Suits', 'Jackets', 'Trousers', 'Jeans'],
    },
    {
      heading: 'Shoes & Accessories',
      items: ['Shoes', 'Accessories'],
    },
  ],
  Kids: [
    {
      heading: 'By Collection',
      items: ['Girls', 'Boys', 'Baby'],
    },
    {
      heading: 'Apparel',
      items: ['Dresses', 'Tops', 'Sets', 'Jeans', 'Pajamas'],
    },
    {
      heading: 'Shoes & Accessories',
      items: ['Shoes', 'Accessories'],
    },
  ],
};

const STORAGE_KEY = 'velora-custom-categories-v2';

export function getCategoryTree() {
  if (typeof window === 'undefined') return DEFAULT_CATEGORY_TREE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORY_TREE));
      return DEFAULT_CATEGORY_TREE;
    }
    const custom = JSON.parse(raw);
    if (!custom || typeof custom !== 'object') return DEFAULT_CATEGORY_TREE;

    // Merge default categories with custom categories
    const merged = { ...DEFAULT_CATEGORY_TREE };
    Object.keys(custom).forEach((dept) => {
      if (!merged[dept]) {
        merged[dept] = custom[dept] || [];
      } else {
        const combined = Array.from(new Set([...(merged[dept] || []), ...(custom[dept] || [])]));
        merged[dept] = combined;
      }
    });
    return merged;
  } catch (err) {
    console.error('Failed to parse categories:', err);
    return DEFAULT_CATEGORY_TREE;
  }
}

/**
 * Intelligent subcategory matcher ensuring that every category filters
 * and displays accurate pieces from the catalog.
 */
export function matchesSubcategory(product, subcategoryName) {
  if (!product || !subcategoryName) return true;
  const sub = subcategoryName.toLowerCase().trim();
  const name = (product.name || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const text = `${name} ${cat} ${desc}`;

  // Direct exact match
  if (product.subcategory && product.subcategory.toLowerCase() === sub) return true;

  switch (sub) {
    // Women categories
    case 'dresses':
      return /dress|gown|satin dress|maxi|floral dress/i.test(text);
    case 'evening dresses':
      return /evening|satin dress|silk gown|gown|cocktail|velvet party/i.test(text) || (/dress/i.test(text) && !/casual/i.test(text));
    case 'casual dresses':
      return /casual dress|floral dress|maxi dress|linen dress|shirt dress|day dress/i.test(text) || (/dress/i.test(text) && !/evening/i.test(text));
    case 'jeans':
      return /jean|denim/i.test(text);
    case 'trousers':
      return /trouser|pant|chino|tailored pant|slack|suit|jogger/i.test(text);
    case 'tops & blouses':
    case 'tops':
      return /top|blouse|shirt|camisole|t-shirt|tee/i.test(text);
    case 'shirts':
      return /shirt|blouse|oxford/i.test(text);
    case 't-shirts':
      return /t-shirt|tshirt|tee|polo|shirt|top/i.test(text);
    case 't-shirts & polos':
      return /polo|t-shirt|tshirt|tee/i.test(text);
    case 'skirts':
      return /skirt|pleated|dress|gown/i.test(text);
    case 'pajamas & sleepwear':
    case 'pajamas':
      return /pajama|sleepwear|lounge|silk set|nightwear|onesie|knit set|hoodie/i.test(text);
    case 'knitwear':
      return /knit|sweater|cardigan|cashmere|wool|scarf/i.test(text);
    case 'jackets & coats':
    case 'jackets':
      return /jacket|coat|blazer|puffer|bomber|outerwear|suit/i.test(text);
    case 'suits':
      return /suit|tuxedo|blazer/i.test(text);
    case 'hoodies':
      return /hoodie|sweatshirt|pullover/i.test(text);
    case 'shoes':
      return /shoe|heel|sneaker|loafer|boot|flat|pump/i.test(text);
    case 'bags':
      return /bag|handbag|tote|purse|clutch|shoulder bag/i.test(text);
    case 'accessories':
      return /accessory|accessories|scarf|belt|watch|sunglasses|wallet|jewel|hat|bag|canvas/i.test(text);

    // Kids categories
    case 'girls':
      return /girl/i.test(text) || (cat === 'kids' && /dress|skirt/i.test(text));
    case 'boys':
      return /boy/i.test(text) || (cat === 'kids' && /chino|polo|jogger|shirt/i.test(text));
    case 'baby':
      return /baby|onesie|infant|toddler/i.test(text);
    case 'sets':
      return /set|onesie|suit|pajama set/i.test(text);

    default: {
      const words = sub.split(/[&\s,/-]+/).filter(w => w.length > 2);
      if (words.length === 0) return true;
      return words.some(w => text.includes(w));
    }
  }
}

/**
 * Robust department predicate ensuring strict separation between Men, Women, and Kids
 */
export function isProductInDepartment(product, deptName) {
  if (!product || !deptName) return true;
  const dept = deptName.toLowerCase().trim();

  // Strict check by product ID prefix
  if (product.id?.startsWith('women-')) return dept === 'women';
  if (product.id?.startsWith('men-')) return dept === 'men';
  if (product.id?.startsWith('kids-')) return dept === 'kids';

  if (dept === 'women') {
    // Exclude anything explicitly male
    if (product.category === 'Men' || /\bmen\b/i.test(product.category) || /\bmen\b/i.test(product.name)) return false;
    if (['Men\'s Suits Collection', 'Men\'s Shirts', 'Men\'s Jeans', 'Men\'s Jackets', 'Men\'s Shoes', 'Men\'s Accessories'].includes(product.category)) return false;
    if (['new-arrivals-18', 'new-arrivals-20', 'sale-29', 'sale-30', 'sale-31', 'sale-32', 'sale-33', 'sale-34'].includes(product.id)) return false;

    if (product.category === 'Women' || product.department === 'Women') return true;
    if (/\bwomen/i.test(product.category) || /\bwomen/i.test(product.name)) return true;
    if (['Bags Collection', 'Dresses Collection', "Women's Suits Collection", 'High Heels Collection', 'Accessories Collection'].includes(product.category)) return true;
    if (['new-arrivals-17', 'new-arrivals-19', 'new-arrivals-21', 'new-arrivals-22', 'sale-23', 'sale-24', 'sale-25', 'sale-26', 'sale-27', 'sale-28'].includes(product.id)) return true;
    return false;
  }

  if (dept === 'men') {
    // Exclude anything explicitly female
    if (product.category === 'Women' || /\bwomen/i.test(product.category) || /\bwomen/i.test(product.name)) return false;
    if (['Bags Collection', 'Dresses Collection', "Women's Suits Collection", 'High Heels Collection', 'Accessories Collection'].includes(product.category)) return false;
    if (['new-arrivals-17', 'new-arrivals-19', 'new-arrivals-22', 'sale-23', 'sale-24', 'sale-25', 'sale-26', 'sale-27', 'sale-28'].includes(product.id)) return false;

    if (product.category === 'Men' || product.department === 'Men') return true;
    if (/\bmen\b/i.test(product.category) || /\bmen\b/i.test(product.name)) return true;
    if (["Men's Suits Collection", "Men's Shirts", "Men's Jeans", "Men's Jackets", "Men's Shoes", "Men's Accessories"].includes(product.category)) return true;
    if (['new-arrivals-18', 'new-arrivals-20', 'sale-29', 'sale-30', 'sale-31', 'sale-32', 'sale-33', 'sale-34'].includes(product.id)) return true;
    return false;
  }

  if (dept === 'kids') {
    return product.category === 'Kids' || product.department === 'Kids' || /\bkids\b/i.test(product.category);
  }

  // Custom departments
  return product.category?.toLowerCase() === dept || product.department?.toLowerCase() === dept;
}

export function saveCategoryTree(tree) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
  } catch (err) {
    console.error('Failed to save categories:', err);
  }
}

export function addSubcategory(dept, subName) {
  if (!dept || !subName?.trim()) return getCategoryTree();
  const current = getCategoryTree();
  const list = current[dept] ? [...current[dept]] : [];
  const cleanSub = subName.trim();
  if (!list.includes(cleanSub)) {
    list.push(cleanSub);
    current[dept] = list;
    saveCategoryTree(current);
  }
  return current;
}

export function removeSubcategory(dept, subName) {
  const current = getCategoryTree();
  if (!current[dept]) return current;
  current[dept] = current[dept].filter((s) => s.toLowerCase() !== subName.toLowerCase());
  saveCategoryTree(current);
  return current;
}

export function addDepartment(deptName) {
  if (!deptName?.trim()) return getCategoryTree();
  const current = getCategoryTree();
  const cleanDept = deptName.trim();
  if (!current[cleanDept]) {
    current[cleanDept] = ['All', 'Clothing', 'New'];
    saveCategoryTree(current);
  }
  return current;
}

export function resetCategoryTree() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_CATEGORY_TREE;
}
