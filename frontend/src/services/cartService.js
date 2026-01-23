import api from './api'

export const cartService = {
  // Get cart
  getCart: async () => {
    const response = await api.get('/cart/')
    return response.data
  },

  // Add item to cart
  addItem: async (productId, quantity = 1, variationId = null) => {
    const response = await api.post('/cart/items/', {
      product_id: productId,
      quantity,
      variation_id: variationId,
    })
    return response.data
  },

  // Update cart item
  updateItem: async (itemId, quantity) => {
    const response = await api.patch(`/cart/items/${itemId}/`, {
      quantity,
    })
    return response.data
  },

  // Remove item from cart
  removeItem: async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}/`)
    return response.data
  },

  // Clear cart
  clearCart: async () => {
    const response = await api.delete('/cart/clear/')
    return response.data
  },

  // Apply coupon
  applyCoupon: async (couponCode) => {
    const response = await api.post('/cart/apply-coupon/', {
      code: couponCode,
    })
    return response.data
  },

  // Remove coupon
  removeCoupon: async () => {
    const response = await api.post('/cart/remove-coupon/')
    return response.data
  },

  // Get cart summary
  getCartSummary: async () => {
    const response = await api.get('/cart/summary/')
    return response.data
  },

  // Merge guest cart with user cart (after login)
  mergeCart: async (guestCartItems) => {
    const response = await api.post('/cart/merge/', {
      items: guestCartItems,
    })
    return response.data
  },
}

// Local storage cart for guest users
export const localCartService = {
  CART_KEY: 'charme_guest_cart',

  getCart: () => {
    try {
      const cart = localStorage.getItem(localCartService.CART_KEY)
      return cart ? JSON.parse(cart) : { items: [], coupon: null }
    } catch {
      return { items: [], coupon: null }
    }
  },

  saveCart: (cart) => {
    localStorage.setItem(localCartService.CART_KEY, JSON.stringify(cart))
  },

  addItem: (product, quantity = 1) => {
    const cart = localCartService.getCart()
    const existingIndex = cart.items.findIndex(
      (item) => item.product.id === product.id
    )

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity
    } else {
      cart.items.push({
        id: Date.now(),
        product,
        quantity,
      })
    }

    localCartService.saveCart(cart)
    return cart
  },

  updateItem: (itemId, quantity) => {
    const cart = localCartService.getCart()
    const itemIndex = cart.items.findIndex((item) => item.id === itemId)

    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1)
      } else {
        cart.items[itemIndex].quantity = quantity
      }
      localCartService.saveCart(cart)
    }

    return cart
  },

  removeItem: (itemId) => {
    const cart = localCartService.getCart()
    cart.items = cart.items.filter((item) => item.id !== itemId)
    localCartService.saveCart(cart)
    return cart
  },

  clearCart: () => {
    const emptyCart = { items: [], coupon: null }
    localCartService.saveCart(emptyCart)
    return emptyCart
  },

  getItemCount: () => {
    const cart = localCartService.getCart()
    return cart.items.reduce((total, item) => total + item.quantity, 0)
  },

  getTotal: () => {
    const cart = localCartService.getCart()
    return cart.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    )
  },
}

export default cartService
