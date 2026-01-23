/**
 * Axios API Client Configuration
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // Send cookies for session-based cart
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API Service Functions

// Auth
export const authService = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

// Products
export const productService = {
  getAll: (params) => api.get('/products/', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}/`),
  getFeatured: () => api.get('/products/featured/'),
  getNewArrivals: () => api.get('/products/new_arrivals/'),
  search: (query) => api.get('/products/', { params: { search: query } }),
};

// Categories
export const categoryService = {
  getAll: () => api.get('/products/categories/'),
  getBySlug: (slug) => api.get(`/products/categories/${slug}/`),
  getFeatured: () => api.get('/products/categories/featured/'),
};

// Cart
export const cartService = {
  get: () => api.get('/cart/'),
  add: (data) => api.post('/cart/', data),
  update: (itemId, data) => api.patch(`/cart/items/${itemId}/`, data),
  remove: (itemId) => api.delete(`/cart/items/${itemId}/`),
  clear: () => api.delete('/cart/'),
  getSummary: (couponCode = '') => api.get('/cart/summary/', { params: { coupon: couponCode } }),
  applyCoupon: (code) => api.post('/cart/apply-coupon/', { code }),
};

// Orders
export const orderService = {
  create: (data) => api.post('/orders/', data),
  getAll: () => api.get('/orders/'),
  getById: (id) => api.get(`/orders/${id}/`),
  cancel: (id) => api.post(`/orders/${id}/cancel/`),
};

// Payments
export const paymentService = {
  // Stripe
  createStripePayment: (orderId) => api.post('/payments/stripe/', { order_id: orderId }),
  
  // EasyPaisa
  createEasyPaisaPayment: (orderId, phone) => 
    api.post('/payments/easypaisa/', { order_id: orderId, phone }),
  
  // JazzCash
  createJazzCashPayment: (orderId, phone) => 
    api.post('/payments/jazzcash/', { order_id: orderId, phone }),
  
  // Cash on Delivery
  createCODPayment: (orderId, phone, notes) => 
    api.post('/payments/cod/', { order_id: orderId, phone, notes }),
  
  // Status
  getStatus: (paymentId) => api.get(`/payments/${paymentId}/status/`),
};

// Contact
export const contactService = {
  sendMessage: (data) => api.post('/contact/', data),
};

export {
  api,
  authService as authAPI,
  productService as productsAPI,
  categoryService as categoriesAPI,
  cartService as cartAPI,
  orderService as ordersAPI,
  paymentService as paymentsAPI,
  contactService as contactAPI,
};

