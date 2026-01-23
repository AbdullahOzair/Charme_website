import api from './api'

export const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders/', orderData)
    return response.data
  },

  // Get all user orders
  getOrders: async (params = {}) => {
    const response = await api.get('/orders/', { params })
    return response.data
  },

  // Get order by order number
  getOrderByNumber: async (orderNumber) => {
    const response = await api.get(`/orders/by-number/${orderNumber}/`)
    return response.data
  },

  // Get order by ID
  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/`)
    return response.data
  },

  // Cancel order
  cancelOrder: async (orderId, reason = '') => {
    const response = await api.post(`/orders/${orderId}/cancel/`, {
      reason,
    })
    return response.data
  },

  // Track order
  trackOrder: async (orderNumber) => {
    const response = await api.get(`/orders/track/${orderNumber}/`)
    return response.data
  },

  // Get order status history
  getOrderHistory: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/history/`)
    return response.data
  },

  // Reorder (create new order from existing order)
  reorder: async (orderId) => {
    const response = await api.post(`/orders/${orderId}/reorder/`)
    return response.data
  },

  // Calculate shipping
  calculateShipping: async (addressData) => {
    const response = await api.post('/orders/calculate-shipping/', addressData)
    return response.data
  },

  // Validate order data before submission
  validateOrder: async (orderData) => {
    const response = await api.post('/orders/validate/', orderData)
    return response.data
  },
}

export default orderService
