/**
 * Wishlist Store (Zustand)
 *
 * Persists the user's saved products to localStorage. Items auto-expire 30 days
 * after they were added (each item carries an `addedAt` timestamp).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Drop items older than 30 days; backfill a missing addedAt (legacy items get a
// one-time 30-day grace instead of being removed immediately).
const prune = (items) => {
  const now = Date.now();
  return (items ?? [])
    .map((it) => (it.addedAt ? it : { ...it, addedAt: now }))
    .filter((it) => now - it.addedAt < EXPIRY_MS);
};

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      // True if the product is already saved
      isWishlisted: (productId) =>
        get().items.some((item) => item.id === productId),

      // Add a product to the wishlist (no-op if already present)
      addItem: (product) =>
        set((state) =>
          state.items.some((item) => item.id === product.id)
            ? state
            : { items: [...state.items, { ...product, addedAt: Date.now() }] }
        ),

      // Remove a product from the wishlist
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),

      // Toggle a product in/out of the wishlist; returns true if now added
      toggleItem: (product) => {
        const exists = get().items.some((item) => item.id === product.id);
        if (exists) {
          get().removeItem(product.id);
          return false;
        }
        get().addItem(product);
        return true;
      },

      // Remove items older than 30 days (and backfill legacy timestamps)
      purgeExpired: () => set((state) => ({ items: prune(state.items) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'charme-wishlist',
      // Prune expired items every time the store rehydrates on app load.
      onRehydrateStorage: () => (state) => {
        if (state) state.purgeExpired();
      },
    }
  )
);

export { useWishlistStore };
export default useWishlistStore;
