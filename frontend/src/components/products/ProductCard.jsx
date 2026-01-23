import { Link } from 'react-router-dom'
import { HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
import { useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'
import { productService } from '../../services/productService'
import toast from 'react-hot-toast'

const ProductCard = ({ product, showQuickAdd = true }) => {
  const [isWishlisted, setIsWishlisted] = useState(product.is_wishlisted || false)
  const [isLoading, setIsLoading] = useState(false)
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLoading(true)
    try {
      await addItem(product, 1)
      toast.success('Added to cart!')
    } catch {
      toast.error('Failed to add to cart')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }

    try {
      await productService.toggleWishlist(product.id)
      setIsWishlisted(!isWishlisted)
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
    } catch {
      toast.error('Failed to update wishlist')
    }
  }

  return (
    <Link 
      to={`/products/${product.slug}`}
      className="group block"
    >
      <div className="card overflow-hidden">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.image || '/images/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.is_new && (
              <span className="badge-new">New</span>
            )}
            {product.is_on_sale && product.discount_percent > 0 && (
              <span className="badge-sale">-{Math.round(product.discount_percent)}% OFF</span>
            )}
            {product.is_bestseller && (
              <span className="badge-bestseller">Best Seller</span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWishlisted ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Quick Add Button */}
          {showQuickAdd && product.in_stock && (
            <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="w-full py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 font-medium rounded-lg hover:bg-primary-600 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBagIcon className="h-5 w-5" />
                {isLoading ? 'Adding...' : 'Quick Add'}
              </button>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {!product.in_stock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="px-4 py-2 bg-white text-gray-900 font-medium rounded-lg">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {product.category && (
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {product.category.name}
            </p>
          )}
          
          {/* Name */}
          <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          {product.average_rating > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(product.average_rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({product.review_count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-2 flex items-center gap-2">
            {product.is_on_sale && product.sale_price ? (
              <>
                <span className="text-lg font-semibold text-red-600">
                  Rs. {Number(product.sale_price).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  Rs. {Number(product.price).toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-lg font-semibold text-gray-900">
                Rs. {Number(product.price).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
