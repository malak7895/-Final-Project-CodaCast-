// VELORA Product Image Gallery & Multi-View Engine
// Supports 4 standard photographic angles: Front, Back, Side, Detail
// Supports color variants with independent 4-view sets

export const VIEW_KEYS = ['front', 'back', 'side', 'detail'];

export const VIEW_INFO = {
  front: { key: 'front', label: 'Front View', short: 'Front', description: 'Full frontal silhouette' },
  back: { key: 'back', label: 'Back View', short: 'Back', description: 'Rear drape & tailoring' },
  side: { key: 'side', label: 'Side View', short: 'Side', description: 'Profile & movement' },
  detail: { key: 'detail', label: 'Detail View', short: 'Detail', description: 'Texture, seams & hardware' },
};

/**
 * Returns dynamic localized view labels and descriptions depending on product archetype
 * (e.g. Bags show "من بره" and "الشنطة من جوه", Shoes show "الجنب الخارجي" and "من جوه والفرشة", Dresses show "الوش" and "الضهر")
 */
export function getViewMeta(key, archetype = 'blazer') {
  if (archetype === 'bag') {
    const bagMap = {
      front: { key: 'front', label: 'من بره · Exterior Front', short: 'من بره · Front', description: 'الواجهة الخارجية للشنطة والخامة' },
      side: { key: 'side', label: 'الجنب · Side Profile', short: 'الجنب · Side', description: 'سمك وتصميم جانب الشنطة' },
      back: { key: 'back', label: 'الظهر · Rear View', short: 'الظهر · Back', description: 'ظهر الشنطة وقفل الحزام' },
      detail: { key: 'detail', label: 'الشنطة من جوه · Inside Lining & Pockets', short: 'من جوه · Interior', description: 'البطانة والجيوب والسحاب الداخلي' },
    };
    return bagMap[key] || VIEW_INFO[key] || { key, label: key, short: key, description: '' };
  }

  if (archetype === 'shoes') {
    const shoeMap = {
      front: { key: 'front', label: 'الجنب الخارجي · Outer Lateral Profile', short: 'الخارجي · Outer', description: 'الجانب الخارجي للكوتشي وتصميمه' },
      back: { key: 'back', label: 'الجنب الداخلي · Inner Medial Profile', short: 'الداخلي · Inner', description: 'الجانب الداخلي للكوتشي وتقوس النعل' },
      side: { key: 'side', label: 'من فوق ومن جوه · Top Insole & Tongue', short: 'من جوه · Insole', description: 'فرشة الكوتشي والبطانة الداخلية والأربطة' },
      detail: { key: 'detail', label: 'الكعب والنعل · Heel & Outsole', short: 'النعل · Outsole', description: 'نقشة النعل السفلي وتفاصيل الكعب' },
    };
    return shoeMap[key] || VIEW_INFO[key] || { key, label: key, short: key, description: '' };
  }

  if (archetype === 'dress') {
    const dressMap = {
      front: { key: 'front', label: 'الوش · Front Silhouette', short: 'الوش · Front', description: 'القصة الأمامية الكاملة للفستان' },
      back: { key: 'back', label: 'الضهر · Back & Tailoring', short: 'الضهر · Back', description: 'فتحة الضهر وتفاصيل الخياطة الخلفية' },
      side: { key: 'side', label: 'الجنب الأول · Side Profile 1', short: 'جنب 1 · Side 1', description: 'حركة الفستان والقصة الجانبية' },
      detail: { key: 'detail', label: 'الجنب الثاني والتفاصيل · Side Profile 2 & Seams', short: 'جنب 2 · Side 2', description: 'تفاصيل القماش الفاخر وفتحة الفستان' },
    };
    return dressMap[key] || VIEW_INFO[key] || { key, label: key, short: key, description: '' };
  }

  if (archetype === 'suit') {
    const suitMap = {
      front: { key: 'front', label: 'الوش · Front Silhouette', short: 'الوش · Front', description: 'القصة الأمامية للبدلة والياقة وتطريز الأكتاف' },
      back: { key: 'back', label: 'الضهر · Back & Tailoring', short: 'الضهر · Back', description: 'تفصيل الظهر والأكتاف وفتحة البدلة الخلفية المركزية' },
      side: { key: 'side', label: 'الجنب · Side Profile', short: 'الجنب · Side', description: 'قصة الكم والبنطلون وتناسق القوام الجانبي' },
      detail: { key: 'detail', label: 'التفاصيل والأزرار · Lapel & Cuffs', short: 'التفاصيل · Details', description: 'خامة الصوف الإيطالي وأزرار الأكمام الطبيعية' },
    };
    return suitMap[key] || VIEW_INFO[key] || { key, label: key, short: key, description: '' };
  }

  return VIEW_INFO[key] || { key, label: key, short: key, description: '' };
}

// Curated high-resolution fashion photography by garment archetype
// Grounded in VELORA's clean, minimalist, quiet-luxury aesthetic
const ARCHETYPE_VIEWS = {
  blazer: {
    front: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=85',
    
  },
  shirt: {
    front: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=1200&q=85',
    
  },
  dress: {
    front: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=85',
    
  },
  suit: {
    front: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=85',
    
  },
  jeans: {
    front: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=1200&q=85',
    
  },
  jacket: {
    front: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=85',
    
  },
  hoodie: {
    front: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=85',
    
  },
  pajama: {
    front: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1200&q=85',
    
  },
  shoes: {
    front: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=85',
    
  },
  bag: {
    front: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=85',
    
  },
  accessory: {
    front: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=85',
    
  },
};

// Curated 4-view and color variant definitions for core VELORA pieces
export const PRODUCT_CURATIONS = {
  'women-1': {
    colors: [
      {
        name: 'Noir Black',
        hex: '#1f1f1d',
        views: {
          front: 'https://i.pinimg.com/originals/81/8a/15/818a15bc418496a73875d38bed645020.jpg',
          
        },
      },
      {
        name: 'Camel Dune',
        hex: '#b89569',
        views: {
          front: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=85',
          
        },
      },
      {
        name: 'Warm Ivory',
        hex: '#e8e2d5',
        views: {
          front: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=85',
          
        },
      },
    ],
  },
  'women-2': {
    colors: [
      {
        name: 'Crisp White',
        hex: '#f5f5f3',
        views: {
          front: 'https://pyxis.nymag.com/v1/imgs/158/4ac/bf264c70e2a29ca711791f21184ff376ea-ayr-shirt.png',
          
        },
      },
      {
        name: 'Sky Blue',
        hex: '#a2b9cc',
        views: {
          front: 'https://images.unsplash.com/photo-1620012253295-c15c429f66bf?w=1200&q=85',
          
        },
      },
    ],
  },
  'women-3': {
    colors: [
      {
        name: 'Vintage Blue',
        hex: '#3f5673',
        views: {
          front: 'https://styleofsam.com/wp-content/uploads/2023/09/image_picker_61A89B54-F50B-4804-B27D-F5330DA56B2E-12149-000008E6CFA7A000-1024x1536.jpg',
          
        },
      },
      {
        name: 'Washed Black',
        hex: '#2b2b2b',
        views: {
          front: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=1200&q=85',
          
        },
      },
    ],
  },
  'women-4': {
    colors: [
      {
        name: 'Champagne Silk',
        hex: '#e6dac8',
        views: {
          front: '/products/dress-silk-front.jpg',
          back: '/products/dress-silk-back.jpg',
          side: '/products/dress-silk-side.jpg',
          detail: '/products/dress-silk-detail.jpg',
        },
      },
      {
        name: 'Noir Velvet',
        hex: '#181716',
        views: {
          front: 'https://i.pinimg.com/originals/40/9c/31/409c31625ec8415bff7173811969b505.jpg',
          back: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=85',
          side: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=85',
          detail: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=85',
        },
      },
    ],
  },
  'collection-39': {
    views: {
      front: '/products/dress-silk-front.jpg',
      back: '/products/dress-silk-back.jpg',
      side: '/products/dress-silk-side.jpg',
      detail: '/products/dress-silk-detail.jpg',
    },
  },
  'collection-38': {
    views: {
      front: '/products/dress-silk-front.jpg',
      back: '/products/dress-silk-back.jpg',
      side: '/products/dress-silk-side.jpg',
      detail: '/products/dress-silk-detail.jpg',
    },
  },
  'collection-35': {
    views: {
      front: '/products/bag-tote-front.jpg',
      side: '/products/bag-tote-side.jpg',
      detail: '/products/bag-tote-inside.jpg',
    },
  },
  'collection-37': {
    views: {
      front: '/products/bag-tote-front.jpg',
      side: '/products/bag-tote-side.jpg',
      detail: '/products/bag-tote-inside.jpg',
    },
  },
  'new-arrivals-22': {
    views: {
      front: '/products/bag-tote-front.jpg',
      side: '/products/bag-tote-side.jpg',
      detail: '/products/bag-tote-inside.jpg',
    },
  },
  'sale-28': {
    views: {
      front: '/products/bag-tote-front.jpg',
      side: '/products/bag-tote-side.jpg',
      detail: '/products/bag-tote-inside.jpg',
    },
  },
  'collection-69': {
    views: {
      front: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-1-white?$n_640w$&wid=640&fit=constrain',
      back: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-2?$n_640w$&wid=640&fit=constrain',
      side: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-4?$n_640w$&wid=640&fit=constrain',
      detail: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-3?$n_640w$&wid=640&fit=constrain',
    },
  },
  'women-7': {
    views: {
      front: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-1-white?$n_640w$&wid=640&fit=constrain',
      back: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-2?$n_640w$&wid=640&fit=constrain',
      side: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-4?$n_640w$&wid=640&fit=constrain',
      detail: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-3?$n_640w$&wid=640&fit=constrain',
    },
  },
  'men-15': {
    views: {
      front: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-1-white?$n_640w$&wid=640&fit=constrain',
      back: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-2?$n_640w$&wid=640&fit=constrain',
      side: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-4?$n_640w$&wid=640&fit=constrain',
      detail: 'https://images.asos-media.com/products/new-balance-530-trainers-in-white-and-silver/203641128-3?$n_640w$&wid=640&fit=constrain',
    },
  },
  'women-5': {
    colors: [
      {
        name: 'Silk Cream',
        hex: '#eae3d2',
        views: {
          front: 'https://pajamavillage.com.au/cdn/shop/files/TheSweetDreamsPajamas-3.jpg',
          
        },
      },
      {
        name: 'Dusty Rose',
        hex: '#bfa29b',
        views: {
          front: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1200&q=85',
          
        },
      },
    ],
  },
  'men-9': {
    colors: [
      {
        name: 'Ivory Linen',
        hex: '#f0eee8',
        views: {
          front: 'https://prod-img.thesouledstore.com/public/theSoul/uploads/catalog/product/1721196591_1975140.jpg?v=2',
          
        },
      },
      {
        name: 'Olive Sage',
        hex: '#515949',
        views: {
          front: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=1200&q=85',
          
        },
      },
    ],
  },
  'men-10': {
    views: {
      front: '/products/suit-navy-front.jpg',
      back: '/products/suit-navy-back.jpg',
    },
    colors: [
      {
        name: 'Navy Wool',
        hex: '#1d2a44',
        views: {
          front: '/products/suit-navy-front.jpg',
          back: '/products/suit-navy-back.jpg',
        },
      },
      {
        name: 'Midnight Charcoal',
        hex: '#27282b',
        views: {
          front: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=85',
        },
      },
    ],
  },
  'collection-54': {
    views: {
      front: '/products/suit-navy-front.jpg',
      back: '/products/suit-navy-back.jpg',
    },
  },
  'new-arrivals-19': {
    views: {
      front: '/products/dress-velvet-front.jpg',
      back: '/products/dress-velvet-back.jpg',
    },
  },
  'collection-41': {
    views: {
      front: '/products/dress-velvet-front.jpg',
      back: '/products/dress-velvet-back.jpg',
    },
  },
  'sale-24': {
    views: {
      front: '/products/dress-velvet-front.jpg',
      back: '/products/dress-velvet-back.jpg',
    },
  },
  'new-arrivals-18': {
    views: {
      front: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=85',
    },
  },
  'men-11': {
    colors: [
      {
        name: 'Classic Black',
        hex: '#1f1e1c',
        views: {
          front: 'https://i.pinimg.com/originals/6f/79/af/6f79af64e7c22bd45fcd84ae81e7409c.jpg',
          
        },
      },
      {
        name: 'Crisp White',
        hex: '#f5f4ef',
        views: {
          front: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1200&q=85',
          
        },
      },
    ],
  },
  'men-12': {
    colors: [
      {
        name: 'Vintage Blue',
        hex: '#3f5673',
        views: {
          front: 'https://images.urbndata.com/is/image/UrbanOutfitters/69344786_106_b?$xlarge$&fit=constrain&qlt=80&wid=640',
          
        },
      },
      {
        name: 'Dark Indigo',
        hex: '#1d2736',
        views: {
          front: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=1200&q=85',
          
        },
      },
    ],
  },
  'men-13': {
    colors: [
      {
        name: 'Vintage Noir',
        hex: '#1a1918',
        views: {
          front: 'https://mediaslide-europe.storage.googleapis.com/eastwest/pictures/1760/6024/large-1610640671-ca19706882de5522a102fd0e6309ec95.jpg?v=1619688854',
          
        },
      },
      {
        name: 'Cognac Amber',
        hex: '#693e22',
        views: {
          front: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=85',
          
        },
      },
    ],
  },
  'men-14': {
    colors: [
      {
        name: 'Heather Sand',
        hex: '#d6cdbd',
        views: {
          front: 'https://5.imimg.com/data5/SELLER/Default/2025/3/495358274/GO/LU/CE/123846584/mens-plain-hoodies-1000x1000.jpg',
          
        },
      },
      {
        name: 'Onyx Black',
        hex: '#1c1b18',
        views: {
          front: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=85',
          
        },
      },
    ],
  },
};

/**
 * Detects garment archetype based on product name and category
 */
export function getGarmentArchetype(p) {
  if (!p) return 'blazer';
  const text = `${p.name || ''} ${p.category || ''}`.toLowerCase();
  if (/(blazer)/.test(text)) return 'blazer';
  if (/(suit)/.test(text)) return 'suit';
  if (/(dress)/.test(text)) return 'dress';
  if (/(shirt|blouse)/.test(text)) return 'shirt';
  if (/(jean|denim|trouser|pant)/.test(text)) return 'jeans';
  if (/(jacket|coat|bomber)/.test(text)) return 'jacket';
  if (/(hoodie|sweater|knit|cardigan|sweatshirt)/.test(text)) return 'hoodie';
  if (/(pajama|sleepwear|lounge)/.test(text)) return 'pajama';
  if (/(sneaker|shoe|heel|boot|loafer)/.test(text)) return 'shoes';
  if (/(bag|handbag|tote|purse)/.test(text)) return 'bag';
  return 'blazer';
}

/**
 * Checks if a product is a clothing piece
 */
export function isClothingProduct(p) {
  if (!p) return false;
  const text = `${p.name || ''} ${p.category || ''}`.toLowerCase();
  if (/(sneaker|heel|loafer|shoe|running)/.test(text)) return false;
  if (/(bag|handbag|scarf|watch|belt|sunglasses|wallet)/.test(text)) return false;
  return true;
}

/**
 * Resolves the 4 views (front, back, side, detail) and active color for any product
 * Priority order:
 * 1. Product-level custom configured views (from admin or curation)
 * 2. Color variant views (if selected)
 * 3. Garment archetype fallbacks (ensuring all 4 views are populated)
 */
export function resolveProductViews(product, selectedColorName = null) {
  if (!product) {
    const fallback = ARCHETYPE_VIEWS.blazer;
    return {
      views: fallback,
      viewList: VIEW_KEYS.map(k => ({
        key: k,
        label: VIEW_INFO[k].label,
        shortLabel: VIEW_INFO[k].short,
        url: fallback[k],
      })),
      activeColor: null,
      colors: [],
    };
  }

  // 1. Check if product has colors configured in its object OR in curations
  const curation = PRODUCT_CURATIONS[product.id];
  const configuredColors = (Array.isArray(product.colors) && product.colors.length > 0)
    ? product.colors
    : (curation?.colors || []);

  // Determine active color variant
  let activeColor = null;
  if (configuredColors.length > 0) {
    if (selectedColorName) {
      activeColor = configuredColors.find(c => c.name.toLowerCase() === selectedColorName.toLowerCase())
        || configuredColors[0];
    } else {
      activeColor = configuredColors[0];
    }
  }

  // Archetype default views for this garment type
  const archetype = getGarmentArchetype(product);
  const archetypeViews = ARCHETYPE_VIEWS[archetype] || ARCHETYPE_VIEWS.blazer;

  // Resolve views from activeColor, product.views, or archetype
  const colorViews = activeColor?.views || {};
  const productViews = product.views || curation?.views || {};
  const primaryFront = colorViews.front || productViews.front || product.image || archetypeViews.front;

  // Genuine views: Do not replace unavailable angles with unrelated archetype images.
  const views = {
    front: primaryFront,
    back: colorViews.back || productViews.back || '',
    side: colorViews.side || productViews.side || '',
    detail: colorViews.detail || productViews.detail || '',
  };

  const viewList = VIEW_KEYS
    .filter(k => Boolean(views[k]))
    .map(k => {
      const meta = getViewMeta(k, archetype);
      return {
        key: k,
        label: meta.label,
        shortLabel: meta.short,
        description: meta.description,
        url: views[k],
      };
    });

  if (viewList.length === 0 && primaryFront) {
    const meta = getViewMeta('front', archetype);
    viewList.push({
      key: 'front',
      label: meta.label,
      shortLabel: meta.short,
      description: meta.description,
      url: primaryFront,
    });
  }

  return {
    views,
    viewList,
    activeColor,
    colors: configuredColors,
  };
}

/**
 * Returns the secondary image to use for hover preview on product cards
 */
export function getHoverPreviewImage(product, colorName = null) {
  if (!product) return null;
  const { views } = resolveProductViews(product, colorName);
  // Only use secondary hover preview if a genuine distinct view exists
  if (views.back && views.back !== views.front) return views.back;
  if (views.side && views.side !== views.front) return views.side;
  return null;
}

/**
 * Resolves a gender and department-appropriate fallback image
 * (ensuring Men's pieces never fall back to images of women, and vice versa)
 */
export function getProductFallback(p) {
  if (p?.category === 'Kids' || /kids/i.test(p?.category) || p?.id?.startsWith('kids-')) {
    return 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&q=80';
  }
  if (
    p?.category === 'Men' ||
    /\bmen\b/i.test(p?.category) ||
    p?.id?.startsWith('men-') ||
    ["Men's Suits Collection", "Men's Shirts", "Men's Jeans", "Men's Jackets", "Men's Shoes", "Men's Accessories"].includes(p?.category)
  ) {
    return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80';
}
