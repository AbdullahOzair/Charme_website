/**
 * Cart Store (Zustand)
 */
import { create } from 'zustand';
import { cartService } from '../services/api';
import toast from 'react-hot-toast';

const useCartStore = create((set, get) => ({
  cart: null,
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,

  // Fetch cart
  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await cartService.get();
      // Backend returns cart directly: { id, items, total_items, total_price, updated_at }
      const cart = response.data;
      const items = cart.items || [];
      
      set({
        cart,
        items,
        totalItems: cart.total_items || items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        totalPrice: parseFloat(cart.total_price || 0),
        isLoading: false,
      });
    } catch (error) {
      console.error('Fetch cart error:', error);
      // Reset to empty cart on error
      set({ 
        cart: null,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        isLoading: false 
      });
    }
  },

  // Add to cart
  addItem: async (productId, quantity = 1) => {
    try {
      await cartService.add({ product_id: productId, quantity });
      await get().fetchCart();
      toast.success('Added to cart!');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to add to cart';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  // Update cart item
  updateItem: async (itemId, quantity) => {
    try {
      await cartService.update(itemId, { quantity });
      await get().fetchCart();
      return { success: true };
    } catch (error) {
      toast.error('Failed to update cart');
      return { success: false };
    }
  },

  // Remove from cart
  removeItem: async (itemId) => {
    try {
      await cartService.remove(itemId);
      await get().fetchCart();
      toast.success('Item removed');
      return { success: true };
    } catch (error) {
      toast.error('Failed to remove item');
      return { success: false };
    }
  },

  // Clear cart
  clearCart: async () => {
    try {
      await cartService.clear();
      set({
        items: [],
        totalItems: 0,
        totalPrice: 0,
      });
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  },
}));

export { useCartStore };
export default useCartStore;

