/**
 * Wishlist Store (Zustand)
 *
 * Persists the user's saved products to localStorage so the collection
 * survives page refreshes and stays until the user explicitly removes an item.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
            : { items: [...state.items, product] }
        ),

      // Remove a product from the wishlist
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),

      // Toggle a product in/out of the wishlist; returns the new state
      toggleItem: (product) => {
        const exists = get().items.some((item) => item.id === product.id);
        if (exists) {
          get().removeItem(product.id);
          return false;
        }
        get().addItem(product);
        return true;
      },

      clear: () => set({ items: [] }),
    }),
    {
      name: 'charme-wishlist',
    }
  )
);

export { useWishlistStore };
export default useWishlistStore;
