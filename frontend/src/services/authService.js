import api from './api'

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData)
    return response.data
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials)
    return response.data
  },

  // Logout user
  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout/', {
      refresh: refreshToken,
    })
    return response.data
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/token/refresh/', {
      refresh: refreshToken,
    })
    return response.data
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile/')
    return response.data
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile/', profileData)
    return response.data
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password/', passwordData)
    return response.data
  },

  // Get user addresses
  getAddresses: async () => {
    const response = await api.get('/auth/addresses/')
    return response.data
  },

  // Add new address
  addAddress: async (addressData) => {
    const response = await api.post('/auth/addresses/', addressData)
    return response.data
  },

  // Update address
  updateAddress: async (addressId, addressData) => {
    const response = await api.put(`/auth/addresses/${addressId}/`, addressData)
    return response.data
  },

  // Delete address
  deleteAddress: async (addressId) => {
    const response = await api.delete(`/auth/addresses/${addressId}/`)
    return response.data
  },

  // Set default address
  setDefaultAddress: async (addressId, type) => {
    const response = await api.post(`/auth/addresses/${addressId}/set_default/`, {
      type,
    })
    return response.data
  },
}

export default authService
