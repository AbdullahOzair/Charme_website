import api from './api'

export const productService = {
  // Get all products with optional filters
  getProducts: async (params = {}) => {
    const response = await api.get('/products/', { params })
    return response.data
  },

  // Get single product by slug
  getProduct: async (slug) => {
    const response = await api.get(`/products/${slug}/`)
    return response.data
  },

  // Get featured products
  getFeaturedProducts: async (limit = 8) => {
    const response = await api.get('/products/', {
      params: { is_featured: true, page_size: limit },
    })
    return response.data
  },

  // Get best seller products
  getBestSellers: async (limit = 8) => {
    const response = await api.get('/products/', {
      params: { ordering: '-total_sales', page_size: limit },
    })
    return response.data
  },

  // Get new arrivals
  getNewArrivals: async (limit = 8) => {
    const response = await api.get('/products/', {
      params: { ordering: '-created_at', page_size: limit },
    })
    return response.data
  },

  // Get products on sale
  getSaleProducts: async (limit = 8) => {
    const response = await api.get('/products/', {
      params: { on_sale: true, page_size: limit },
    })
    return response.data
  },

  // Get related products
  getRelatedProducts: async (productSlug, limit = 4) => {
    const response = await api.get(`/products/${productSlug}/related/`, {
      params: { page_size: limit },
    })
    return response.data
  },

  // Search products
  searchProducts: async (query, params = {}) => {
    const response = await api.get('/products/', {
      params: { search: query, ...params },
    })
    return response.data
  },

  // Get all categories
  getCategories: async () => {
    const response = await api.get('/products/categories/')
    return response.data
  },

  // Get products by category
  getProductsByCategory: async (categorySlug, params = {}) => {
    const response = await api.get('/products/', {
      params: { category: categorySlug, ...params },
    })
    return response.data
  },

  // Get product reviews
  getProductReviews: async (productSlug, params = {}) => {
    const response = await api.get(`/products/${productSlug}/reviews/`, { params })
    return response.data
  },

  // Add product review
  addProductReview: async (productSlug, reviewData) => {
    const response = await api.post(`/products/${productSlug}/reviews/`, reviewData)
    return response.data
  },

  // Get wishlist
  getWishlist: async () => {
    const response = await api.get('/products/wishlist/')
    return response.data
  },

  // Add to wishlist
  addToWishlist: async (productId) => {
    const response = await api.post('/products/wishlist/', {
      product_id: productId,
    })
    return response.data
  },

  // Remove from wishlist
  removeFromWishlist: async (wishlistItemId) => {
    const response = await api.delete(`/products/wishlist/${wishlistItemId}/`)
    return response.data
  },

  // Toggle wishlist
  toggleWishlist: async (productId) => {
    const response = await api.post('/products/wishlist/toggle/', {
      product_id: productId,
    })
    return response.data
  },
}

export default productService
