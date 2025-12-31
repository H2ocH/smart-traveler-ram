import AsyncStorage from '@react-native-async-storage/async-storage';

export type BaggageClaimType = 'lost' | 'damaged';
export type BaggageClaimStatus = 'submitted' | 'in_review' | 'resolved';

export type BaggageClaim = {
  id: string;
  type: BaggageClaimType;
  status: BaggageClaimStatus;
  createdAt: string;
  passengerName?: string;
  flightNumber?: string;
  baggageTagNumber?: string;
  payload: Record<string, any>;
};

const STORAGE_KEY = 'baggageClaims';

const safeParseClaims = (raw: string | null): BaggageClaim[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BaggageClaim[]) : [];
  } catch {
    return [];
  }
};

export const listBaggageClaims = async (): Promise<BaggageClaim[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const claims = safeParseClaims(raw);
  return claims.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
};

export const listBaggageClaimsForPassenger = async (passengerName: string): Promise<BaggageClaim[]> => {
  const claims = await listBaggageClaims();
  return claims.filter((c) => (c.passengerName || '').trim() === passengerName.trim());
};

export const addBaggageClaim = async (input: {
  type: BaggageClaimType;
  passengerName?: string;
  flightNumber?: string;
  baggageTagNumber?: string;
  payload: Record<string, any>;
}): Promise<BaggageClaim> => {
  const now = new Date();
  const claim: BaggageClaim = {
    id: `CLM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
    type: input.type,
    status: 'submitted',
    createdAt: now.toISOString(),
    passengerName: input.passengerName,
    flightNumber: input.flightNumber,
    baggageTagNumber: input.baggageTagNumber,
    payload: input.payload,
  };

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const existing = safeParseClaims(raw);
  const next = [claim, ...existing];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return claim;
};

export const clearBaggageClaims = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};

export const clearBaggageClaimsForPassenger = async (passengerName: string): Promise<void> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const existing = safeParseClaims(raw);
  const next = existing.filter((c) => (c.passengerName || '').trim() !== passengerName.trim());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

export const removeBaggageClaim = async (id: string): Promise<void> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const existing = safeParseClaims(raw);
  const next = existing.filter((c) => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};
