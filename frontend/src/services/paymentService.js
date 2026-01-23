import api from './api'

export const paymentService = {
  // Create Stripe payment intent
  createPaymentIntent: async (orderId) => {
    const response = await api.post('/payments/create-intent/', {
      order_id: orderId,
    })
    return response.data
  },

  // Process payment
  processPayment: async (paymentData) => {
    const response = await api.post('/payments/process/', paymentData)
    return response.data
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId) => {
    const response = await api.post('/payments/confirm/', {
      payment_intent_id: paymentIntentId,
    })
    return response.data
  },

  // Get available payment methods
  getPaymentMethods: async () => {
    const response = await api.get('/payments/methods/')
    return response.data
  },

  // Get payment by ID
  getPayment: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/`)
    return response.data
  },

  // Get payment by order
  getPaymentByOrder: async (orderId) => {
    const response = await api.get(`/payments/by-order/${orderId}/`)
    return response.data
  },

  // Request refund
  requestRefund: async (paymentId, reason) => {
    const response = await api.post(`/payments/${paymentId}/refund/`, {
      reason,
    })
    return response.data
  },

  // Initialize EasyPaisa payment
  initEasyPaisa: async (orderId, phoneNumber) => {
    const response = await api.post('/payments/easypaisa/init/', {
      order_id: orderId,
      phone_number: phoneNumber,
    })
    return response.data
  },

  // Verify EasyPaisa payment
  verifyEasyPaisa: async (transactionId) => {
    const response = await api.post('/payments/easypaisa/verify/', {
      transaction_id: transactionId,
    })
    return response.data
  },

  // Initialize JazzCash payment
  initJazzCash: async (orderId, phoneNumber) => {
    const response = await api.post('/payments/jazzcash/init/', {
      order_id: orderId,
      phone_number: phoneNumber,
    })
    return response.data
  },

  // Verify JazzCash payment
  verifyJazzCash: async (transactionId) => {
    const response = await api.post('/payments/jazzcash/verify/', {
      transaction_id: transactionId,
    })
    return response.data
  },

  // Process COD order
  processCOD: async (orderId) => {
    const response = await api.post('/payments/cod/', {
      order_id: orderId,
    })
    return response.data
  },
}

export default paymentService
