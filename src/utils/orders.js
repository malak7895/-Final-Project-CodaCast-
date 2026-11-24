import { collection, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase.js';

export const STATUSES = [
  'Awaiting payment',
  'Processing',
  'Confirmed',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const STORAGE_KEY = 'velora-orders-v2';

// Realistic initial orders for VELORA clients
const SEED_ORDERS = [
  {
    id: 'VEL-9821A',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6, // 6 days ago
    status: 'Delivered',
    method: 'card',
    uid: 'demo-user-1',
    isDemo: true,
    customer: {
      name: 'Sophia Laurent',
      email: 'sophia.laurent@velora-couture.com',
      phone: '01012345678',
      address: '14 Hassan Sabry St, Apt 4B, Zamalek',
      area: 'Cairo & Giza',
      isDemo: true,
    },
    items: [
      {
        id: 'women-1',
        name: 'Classic Blazer',
        size: 'M',
        color: 'Noir Black',
        qty: 1,
        price: 79.99,
        image: 'https://i.pinimg.com/originals/81/8a/15/818a15bc418496a73875d38bed645020.jpg',
      },
      {
        id: 'women-3',
        name: 'Blue Jeans',
        size: 'S',
        color: 'Camel Dune',
        qty: 1,
        price: 68.99,
        image: 'https://styleofsam.com/wp-content/uploads/2023/09/image_picker_61A89B54-F50B-4804-B27D-F5330DA56B2E-12149-000008E6CFA7A000-1024x1536.jpg',
      },
    ],
    subtotal: 148.98,
    shipping: 0,
    discount: 0,
    total: 148.98,
    carrier: 'Aramex Premier Luxury',
    trackingNumber: 'ARM-VEL-882901',
    estimatedDelivery: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toLocaleDateString(),
  },
  {
    id: 'VEL-7643B',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    status: 'Shipped',
    method: 'cod',
    uid: 'demo-user-1',
    isDemo: true,
    customer: {
      name: 'Sophia Laurent',
      email: 'sophia.laurent@velora-couture.com',
      phone: '01012345678',
      address: '14 Hassan Sabry St, Apt 4B, Zamalek',
      area: 'Cairo & Giza',
      isDemo: true,
    },
    items: [
      {
        id: 'women-2',
        name: 'White Shirt',
        size: 'S',
        color: 'Noir Black',
        qty: 2,
        price: 50.99,
        image: 'https://pyxis.nymag.com/v1/imgs/158/4ac/bf264c70e2a29ca711791f21184ff376ea-ayr-shirt.png',
      },
    ],
    subtotal: 101.98,
    shipping: 1.6,
    discount: 0,
    total: 103.58,
    carrier: 'Bosta White Glove',
    trackingNumber: 'BST-VEL-449102',
    estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toLocaleDateString(),
  },
  {
    id: 'VEL-5219C',
    createdAt: Date.now() - 1000 * 60 * 60 * 18, // 18 hours ago
    status: 'Confirmed',
    method: 'wallet',
    uid: 'client-alex-2',
    isDemo: true,
    customer: {
      name: 'Tarek Mansour',
      email: 'tarek.mansour@example.com',
      phone: '01287654321',
      address: '88 El Horreya Avenue, San Stefano',
      area: 'Alexandria & Delta',
      isDemo: true,
    },
    items: [
      {
        id: 'men-1',
        name: 'Classic Blazer',
        size: 'L',
        color: 'Noir Black',
        qty: 1,
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=85',
      },
      {
        id: 'men-4',
        name: 'Classic Suit',
        size: 'L',
        color: 'Midnight Navy',
        qty: 1,
        price: 189.99,
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=85',
      },
    ],
    subtotal: 279.98,
    shipping: 0,
    discount: 28.0,
    total: 251.98,
    carrier: 'VELORA Concierge Express',
    trackingNumber: 'VLR-EX-109283',
    estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toLocaleDateString(),
  },
  {
    id: 'VEL-3104D',
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    status: 'Processing',
    method: 'card',
    uid: 'demo-user-1',
    isDemo: true,
    customer: {
      name: 'Sophia Laurent',
      email: 'sophia.laurent@velora-couture.com',
      phone: '01012345678',
      address: '14 Hassan Sabry St, Apt 4B, Zamalek',
      area: 'Cairo & Giza',
      isDemo: true,
    },
    items: [
      {
        id: 'kids-1',
        name: 'Kids Velvet Party Dress',
        size: 'S',
        color: 'Noir Black',
        qty: 1,
        price: 54.0,
        image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&q=80',
      },
    ],
    subtotal: 54.0,
    shipping: 1.6,
    discount: 0,
    total: 55.6,
    carrier: 'Aramex Premier Luxury',
    trackingNumber: 'ARM-VEL-991204',
    estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toLocaleDateString(),
  },
];

let memoryOrders = null;

function readLocalOrders() {
  if (typeof window === 'undefined') return memoryOrders || SEED_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ORDERS));
      return SEED_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_ORDERS;
  } catch {
    return memoryOrders || SEED_ORDERS;
  }
}

function writeLocalOrders(orders) {
  memoryOrders = orders;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to write orders:', err);
  }
}

export async function saveOrder(uid, order) {
  const completeOrder = {
    ...order,
    uid: uid || order.uid || 'demo-user-1',
    createdAt: order.createdAt || Date.now(),
    trackingNumber: order.trackingNumber || `VLR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    carrier: order.carrier || 'VELORA Express Delivery',
    estimatedDelivery: order.estimatedDelivery || new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toLocaleDateString(),
  };

  // 1. Save to local storage
  const current = readLocalOrders();
  const existingIdx = current.findIndex(o => o.id === completeOrder.id);
  let updated;
  if (existingIdx !== -1) {
    updated = current.map(o => (o.id === completeOrder.id ? completeOrder : o));
  } else {
    updated = [completeOrder, ...current];
  }
  writeLocalOrders(updated);

  // 2. Sync to Firestore if configured
  if (db) {
    try {
      await setDoc(doc(db, 'orders', completeOrder.id), completeOrder);
    } catch (e) {
      console.warn('Firestore sync failed, local order persisted:', e);
    }
  }

  return completeOrder;
}

export async function getOrders(uid) {
  // If Firestore is available, attempt to fetch from it
  if (db && uid) {
    try {
      const snap = await getDocs(query(collection(db, 'orders'), where('uid', '==', uid)));
      if (!snap.empty) {
        return snap.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt);
      }
    } catch (e) {
      console.warn('Firestore fetch failed, using local orders:', e);
    }
  }

  // Fallback to local orders
  const all = readLocalOrders();
  // In demo mode or if uid matches demo-user-1, return user orders
  if (!uid || uid === 'demo-user-1') {
    return all.filter(o => !o.uid || o.uid === 'demo-user-1' || o.uid === uid).sort((a, b) => b.createdAt - a.createdAt);
  }
  return all.filter(o => o.uid === uid).sort((a, b) => b.createdAt - a.createdAt);
}

// Admin only (reads all orders)
export async function getAllOrders() {
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      if (!snap.empty) {
        const firestoreOrders = snap.docs.map(d => d.data());
        // Merge with local orders
        const local = readLocalOrders();
        const firestoreIds = new Set(firestoreOrders.map(o => o.id));
        const merged = [...firestoreOrders, ...local.filter(o => !firestoreIds.has(o.id))];
        return merged.sort((a, b) => b.createdAt - a.createdAt);
      }
    } catch (e) {
      console.warn('Firestore getAllOrders failed, using local orders:', e);
    }
  }

  return readLocalOrders().sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateStatus(id, status) {
  const all = readLocalOrders();
  const updated = all.map(o => (o.id === id ? { ...o, status } : o));
  writeLocalOrders(updated);

  if (db) {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (e) {
      console.warn('Firestore updateDoc failed, local status updated:', e);
    }
  }
  return updated.find(o => o.id === id);
}

export function resetOrdersToSeed() {
  writeLocalOrders(SEED_ORDERS);
  return SEED_ORDERS;
}

export const TRACKING_STAGES = [
  { key: 'placed', label: 'Order Placed', desc: 'Received & authenticated' },
  { key: 'processing', label: 'Processing & Quality Check', desc: 'Garment inspected & prepared' },
  { key: 'confirmed', label: 'Confirmed & Packaged', desc: 'Wrapped in signature VELORA packaging' },
  { key: 'shipped', label: 'Out for Delivery / Shipped', desc: 'In transit with white glove courier' },
  { key: 'delivered', label: 'Delivered', desc: 'Safely delivered to client' },
];

export function getOrderTrackingStep(status) {
  switch (status) {
    case 'Awaiting payment':
      return 0;
    case 'Processing':
      return 1;
    case 'Confirmed':
      return 2;
    case 'Shipped':
      return 3;
    case 'Delivered':
      return 4;
    case 'Cancelled':
      return -1;
    default:
      return 1;
  }
}
