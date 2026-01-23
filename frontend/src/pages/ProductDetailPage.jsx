import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  HeartIcon, 
  ShoppingBagIcon, 
  TruckIcon, 
  ShieldCheckIcon,
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { productService } from '../services/productService'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import ProductGrid from '../components/products/ProductGrid'
import toast from 'react-hot-toast'

const ProductDetailPage = () => {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  
  const { addItem, isLoading: cartLoading } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    fetchProduct()
    window.scrollTo(0, 0)
  }, [slug])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const [productData, relatedData] = await Promise.all([
        productService.getProduct(slug),
        productService.getRelatedProducts(slug, 4),
      ])
      
      setProduct(productData)
      setRelatedProducts(relatedData.results || relatedData)
      setIsWishlisted(productData.is_wishlisted || false)
    } catch (error) {
      console.error('Failed to fetch product:', error)
      toast.error('Product not found')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    try {
      await addItem(product, quantity)
      toast.success('Added to cart!')
    } catch {
      toast.error('Failed to add to cart')
    }
  }

  const handleToggleWishlist = async () => {
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

  if (loading) {
    return <ProductDetailSkeleton />
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Product Not Found</h1>
        <Link to="/products" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    )
  }

  const images = product.images?.length > 0 
    ? product.images 
    : [{ image: product.image || '/images/placeholder.jpg' }]

  const discountPercentage = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            to="/products" 
            className="inline-flex items-center text-gray-600 hover:text-primary-600"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img
                src={images[selectedImage]?.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index 
                        ? 'border-primary-600' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img.image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {product.is_new && (
                <span className="badge-new">New Arrival</span>
              )}
              {discountPercentage > 0 && (
                <span className="badge-sale">{discountPercentage}% OFF</span>
              )}
              {product.is_bestseller && (
                <span className="badge-bestseller">Best Seller</span>
              )}
            </div>

            {/* Category */}
            {product.category && (
              <Link 
                to={`/category/${product.category.slug}`}
                className="text-sm text-gray-500 hover:text-primary-600 uppercase tracking-wider"
              >
                {product.category.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-display font-semibold text-gray-900 mt-2">
              {product.name}
            </h1>

            {/* Rating */}
            {product.average_rating > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    star <= Math.round(product.average_rating) ? (
                      <StarSolidIcon key={star} className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <StarIcon key={star} className="h-5 w-5 text-gray-300" />
                    )
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.average_rating.toFixed(1)} ({product.review_count} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-gray-900">
                Rs. {product.price?.toLocaleString()}
              </span>
              {product.compare_price && (
                <span className="text-xl text-gray-500 line-through">
                  Rs. {product.compare_price?.toLocaleString()}
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="mt-4 text-gray-600">
                {product.short_description}
              </p>
            )}

            {/* Stock Status */}
            <div className="mt-6">
              {product.in_stock ? (
                <span className="inline-flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2" />
                  In Stock
                  {product.stock_quantity && product.stock_quantity < 10 && (
                    <span className="ml-2 text-orange-600">
                      (Only {product.stock_quantity} left)
                    </span>
                  )}
                </span>
              ) : (
                <span className="inline-flex items-center text-red-600">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-2" />
                  Out of Stock
                </span>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            {product.in_stock && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-100"
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="px-6 font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-gray-100"
                      aria-label="Increase quantity"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                    className="flex-1 btn-primary"
                  >
                    <ShoppingBagIcon className="h-5 w-5 mr-2" />
                    {cartLoading ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      isWishlisted 
                        ? 'border-red-500 bg-red-50 text-red-500' 
                        : 'border-gray-300 hover:border-primary-600 hover:text-primary-600'
                    }`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {isWishlisted ? (
                      <HeartSolidIcon className="h-6 w-6" />
                    ) : (
                      <HeartIcon className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <TruckIcon className="h-6 w-6 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Free Shipping</p>
                  <p className="text-xs text-gray-500">Over Rs. 5,000</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Quality Guaranteed</p>
                  <p className="text-xs text-gray-500">Handcrafted with care</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="border-b">
            <div className="flex gap-8">
              {['description', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab} {tab === 'reviews' && `(${product.review_count || 0})`}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description || 'No description available.' }}
              />
            )}
            {activeTab === 'reviews' && (
              <ProductReviews product={product} />
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="section-title mb-8">You May Also Like</h2>
            <ProductGrid products={relatedProducts} columns={4} />
          </section>
        )}
      </div>
    </div>
  )
}

// Product Reviews Component
const ProductReviews = ({ product }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await productService.getProductReviews(product.slug)
        setReviews(data.results || data)
      } catch {
        console.error('Failed to fetch reviews')
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [product.slug])

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b pb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                {review.user?.first_name?.[0] || 'U'}
              </div>
              <div>
                <p className="font-medium">
                  {review.user?.first_name || 'Anonymous'}
                </p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    star <= review.rating ? (
                      <StarSolidIcon key={star} className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <StarIcon key={star} className="h-4 w-4 text-gray-300" />
                    )
                  ))}
                </div>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-600">{review.comment}</p>
        </div>
      ))}
    </div>
  )
}

// Skeleton Loader
const ProductDetailSkeleton = () => (
  <div className="py-8">
    <div className="container-custom">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
)

export default ProductDetailPage
