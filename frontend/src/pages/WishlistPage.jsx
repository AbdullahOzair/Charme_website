import { Link } from 'react-router-dom'
import { HeartIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useWishlistStore } from '../stores/wishlistStore'
import { useCartStore } from '../stores/cartStore'
import toast from 'react-hot-toast'

const WishlistPage = () => {
  const items = useWishlistStore((state) => state.items)
  const removeItem = useWishlistStore((state) => state.removeItem)
  const { addItem } = useCartStore()

  const handleRemove = (productId) => {
    removeItem(productId)
    toast.success('Removed from collection')
  }

  const handleAddToCart = async (product) => {
    try {
      await addItem(product.id, 1)
    } catch {
      toast.error('Failed to add to cart')
    }
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="flex items-center gap-3 mb-8">
          <HeartIcon className="h-8 w-8 text-primary-600" />
          <h1 className="section-title">My Collection</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <HeartIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your collection is empty</h2>
            <p className="text-gray-500 mb-6">Save items you love to your collection.</p>
            <Link to="/shop" className="btn-primary">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((product) => (
              <WishlistItem
                key={product.id}
                product={product}
                onRemove={() => handleRemove(product.id)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const WishlistItem = ({ product, onRemove, onAddToCart }) => {
  const price = product.is_on_sale && product.sale_price ? product.sale_price : product.price

  return (
    <div className="group card overflow-hidden">
      {/* Image */}
      <Link to={`/product/${product.slug}`} className="block relative aspect-square">
        <img
          src={product.image || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            onRemove()
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
          aria-label="Remove from collection"
        >
          <TrashIcon className="h-5 w-5" />
        </button>

        {/* Out of Stock */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-4 py-2 bg-white text-gray-900 font-medium rounded-lg">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">
            Rs. {Number(price).toLocaleString()}
          </span>
          {product.is_on_sale && product.sale_price && (
            <span className="text-sm text-gray-500 line-through">
              Rs. {Number(product.price).toLocaleString()}
            </span>
          )}
        </div>

        {product.in_stock && (
          <button
            onClick={onAddToCart}
            className="mt-3 w-full btn-primary py-2"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  )
}

export default WishlistPage
