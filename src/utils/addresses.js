// VELORA Saved Addresses & Client Profile Engine
// Persists client delivery locations and preferences in localStorage.

const ADDRESS_STORAGE_KEY = 'velora-saved-addresses-v1';
const PROFILE_STORAGE_KEY = 'velora-client-profile-v1';

export const DEFAULT_PROFILE = {
  name: 'Sophia Laurent',
  email: 'sophia.laurent@velora-couture.com',
  phone: '01012345678',
  tier: 'VELORA Privilège',
  memberSince: 'October 2025',
  preferredCurrency: 'EGP',
  newsletter: true,
  smsAlerts: true,
  isDemo: true,
};

export const DEFAULT_ADDRESSES = [
  {
    id: 'addr-1',
    label: 'Primary Residence (Zamalek)',
    recipientName: 'Sophia Laurent',
    phone: '01012345678',
    area: 'Cairo & Giza',
    address: '14 Hassan Sabry St, Apt 4B, Zamalek, Cairo',
    isDefault: true,
    isDemo: true,
  },
  {
    id: 'addr-2',
    label: 'Design Studio / Office',
    recipientName: 'Sophia Laurent',
    phone: '01012345678',
    area: 'Cairo & Giza',
    address: 'Sector 1, Plot 42, North 90th Street, New Cairo',
    isDefault: false,
    isDemo: true,
  },
];

export function getClientProfile() {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function updateClientProfile(fields) {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const current = getClientProfile();
    const updated = { ...current, ...fields };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to update client profile:', err);
    return DEFAULT_PROFILE;
  }
}

export function getSavedAddresses() {
  if (typeof window === 'undefined') return DEFAULT_ADDRESSES;
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(DEFAULT_ADDRESSES));
      return DEFAULT_ADDRESSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ADDRESSES;
  } catch {
    return DEFAULT_ADDRESSES;
  }
}

export function saveAddresses(addresses) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
  } catch (err) {
    console.error('Failed to save addresses:', err);
  }
}

export function addSavedAddress(addr) {
  const list = getSavedAddresses();
  const newAddr = {
    ...addr,
    id: addr.id || `addr-${Date.now()}`,
    isDefault: addr.isDefault || list.length === 0,
  };

  let updated = [...list];
  if (newAddr.isDefault) {
    updated = updated.map(a => ({ ...a, isDefault: false }));
  }
  updated.push(newAddr);
  saveAddresses(updated);
  return updated;
}

export function updateSavedAddress(id, updatedFields) {
  const list = getSavedAddresses();
  let updated = list.map(a => (a.id === id ? { ...a, ...updatedFields } : a));
  if (updatedFields.isDefault) {
    updated = updated.map(a => (a.id === id ? a : { ...a, isDefault: false }));
  }
  saveAddresses(updated);
  return updated;
}

export function deleteSavedAddress(id) {
  const list = getSavedAddresses();
  const updated = list.filter(a => a.id !== id);
  if (updated.length > 0 && !updated.some(a => a.isDefault)) {
    updated[0].isDefault = true;
  }
  saveAddresses(updated);
  return updated;
}

export function setDefaultSavedAddress(id) {
  const list = getSavedAddresses();
  const updated = list.map(a => ({
    ...a,
    isDefault: a.id === id,
  }));
  saveAddresses(updated);
  return updated;
}
