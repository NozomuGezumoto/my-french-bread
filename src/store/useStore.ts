// ============================================
// My French Bread - State Management
// 行ったことがある = チェックのみ
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BakeryPinType = 'boulangerie' | 'patisserie' | 'artisan';

export interface TriedBakery {
  id: string;
  triedAt: string;
}

export interface BakeryMemo {
  id: string;
  note: string;
  rating?: number;
  photos?: string[];
  updatedAt: string;
}

export interface CustomBakery {
  id: string;
  name: string;
  type: BakeryPinType;
  lat: number;
  lng: number;
  address?: string;
  createdAt: string;
}

export type FilterMode = 'all' | 'tried' | 'wantToGo';
export type DistanceFilter = 'none' | '500m' | '1km' | '3km';
export type RegionFilter = string;

interface StoreState {
  triedBakeries: TriedBakery[];
  wantToGoBakeries: string[];
  bakeryMemos: BakeryMemo[];
  customBakeries: CustomBakery[];
  excludedBakeries: string[];

  filterMode: FilterMode;
  distanceFilter: DistanceFilter;
  regionFilter: RegionFilter;
  hideExcluded: boolean;

  setFilterMode: (mode: FilterMode) => void;
  setDistanceFilter: (filter: DistanceFilter) => void;
  setRegionFilter: (filter: RegionFilter) => void;
  setHideExcluded: (value: boolean) => void;

  excludeBakery: (id: string) => void;
  unexcludeBakery: (id: string) => void;
  clearAllExcluded: () => void;
  isExcluded: (id: string) => boolean;

  markAsTried: (id: string) => void;
  unmarkAsTried: (id: string) => void;
  isTried: (id: string) => boolean;
  getTriedCount: () => number;

  addToWantToGo: (id: string) => void;
  removeFromWantToGo: (id: string) => void;
  isWantToGo: (id: string) => boolean;
  getWantToGoCount: () => number;

  setBakeryMemo: (id: string, note: string, rating?: number) => void;
  getBakeryMemo: (id: string) => BakeryMemo | undefined;
  deleteBakeryMemo: (id: string) => void;

  addBakeryPhoto: (id: string, photoUri: string) => void;
  removeBakeryPhoto: (id: string, photoUri: string) => void;
  getBakeryPhotos: (id: string) => string[];

  addCustomBakery: (bakery: Omit<CustomBakery, 'id' | 'createdAt'>) => string;
  updateCustomBakery: (id: string, updates: Partial<CustomBakery>) => void;
  deleteCustomBakery: (id: string) => void;
  getCustomBakeries: () => CustomBakery[];
  isCustomBakery: (id: string) => boolean;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      triedBakeries: [],
      wantToGoBakeries: [],
      bakeryMemos: [],
      customBakeries: [],
      excludedBakeries: [],
      filterMode: 'all',
      distanceFilter: 'none',
      regionFilter: '',
      hideExcluded: false,

      setFilterMode: (mode) => set({ filterMode: mode }),
      setDistanceFilter: (filter) => set({ distanceFilter: filter }),
      setRegionFilter: (filter) => set({ regionFilter: filter }),
      setHideExcluded: (value) => set({ hideExcluded: value }),

      excludeBakery: (id) => {
        set((state) => {
          if (state.excludedBakeries.includes(id)) return state;
          return { excludedBakeries: [...state.excludedBakeries, id] };
        });
      },
      unexcludeBakery: (id) => {
        set((state) => ({
          excludedBakeries: state.excludedBakeries.filter((s) => s !== id),
        }));
      },
      clearAllExcluded: () => set({ excludedBakeries: [] }),
      isExcluded: (id) => get().excludedBakeries.includes(id),

      markAsTried: (id) => {
        if (get().triedBakeries.some((t) => t.id === id)) return;
        set((state) => ({
          triedBakeries: [...state.triedBakeries, { id, triedAt: new Date().toISOString() }],
        }));
      },
      unmarkAsTried: (id) => {
        set((state) => ({
          triedBakeries: state.triedBakeries.filter((t) => t.id !== id),
        }));
      },
      isTried: (id) => get().triedBakeries.some((t) => t.id === id),
      getTriedCount: () => get().triedBakeries.length,

      addToWantToGo: (id) => {
        if (get().wantToGoBakeries.includes(id)) return;
        set((state) => ({ wantToGoBakeries: [...state.wantToGoBakeries, id] }));
      },
      removeFromWantToGo: (id) => {
        set((state) => ({
          wantToGoBakeries: state.wantToGoBakeries.filter((x) => x !== id),
        }));
      },
      isWantToGo: (id) => get().wantToGoBakeries.includes(id),
      getWantToGoCount: () => get().wantToGoBakeries.length,

      setBakeryMemo: (id, note, rating) => {
        set((state) => {
          const existing = state.bakeryMemos.find((m) => m.id === id);
          if (existing) {
            return {
              bakeryMemos: state.bakeryMemos.map((m) =>
                m.id === id ? { ...m, note, rating, updatedAt: new Date().toISOString() } : m
              ),
            };
          }
          return {
            bakeryMemos: [...state.bakeryMemos, { id, note, rating, updatedAt: new Date().toISOString() }],
          };
        });
      },
      getBakeryMemo: (id) => get().bakeryMemos.find((m) => m.id === id),
      deleteBakeryMemo: (id) => {
        set((state) => ({
          bakeryMemos: state.bakeryMemos.filter((m) => m.id !== id),
        }));
      },

      addBakeryPhoto: (id, photoUri) => {
        set((state) => {
          const existing = state.bakeryMemos.find((m) => m.id === id);
          const photos = existing?.photos || [];
          if (photos.length >= 4) return state;
          if (existing) {
            return {
              bakeryMemos: state.bakeryMemos.map((m) =>
                m.id === id ? { ...m, photos: [...photos, photoUri], updatedAt: new Date().toISOString() } : m
              ),
            };
          }
          return {
            bakeryMemos: [...state.bakeryMemos, { id, note: '', photos: [photoUri], updatedAt: new Date().toISOString() }],
          };
        });
      },
      removeBakeryPhoto: (id, photoUri) => {
        set((state) => ({
          bakeryMemos: state.bakeryMemos.map((m) =>
            m.id === id ? { ...m, photos: (m.photos || []).filter((p) => p !== photoUri), updatedAt: new Date().toISOString() } : m
          ),
        }));
      },
      getBakeryPhotos: (id) => {
        const memo = get().bakeryMemos.find((m) => m.id === id);
        return memo?.photos || [];
      },

      addCustomBakery: (bakery) => {
        const id = `custom-${Date.now()}`;
        set((state) => ({
          customBakeries: [...state.customBakeries, { ...bakery, id, createdAt: new Date().toISOString() }],
        }));
        return id;
      },
      updateCustomBakery: (id, updates) => {
        set((state) => ({
          customBakeries: state.customBakeries.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },
      deleteCustomBakery: (id) => {
        set((state) => ({
          customBakeries: state.customBakeries.filter((s) => s.id !== id),
          triedBakeries: state.triedBakeries.filter((t) => t.id !== id),
          wantToGoBakeries: state.wantToGoBakeries.filter((x) => x !== id),
          bakeryMemos: state.bakeryMemos.filter((m) => m.id !== id),
        }));
      },
      getCustomBakeries: () => get().customBakeries,
      isCustomBakery: (id) => id.startsWith('custom-'),
    }),
    {
      name: 'my-french-bread-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        triedBakeries: state.triedBakeries,
        wantToGoBakeries: state.wantToGoBakeries,
        bakeryMemos: state.bakeryMemos,
        customBakeries: state.customBakeries,
        excludedBakeries: state.excludedBakeries,
      }),
    }
  )
);
