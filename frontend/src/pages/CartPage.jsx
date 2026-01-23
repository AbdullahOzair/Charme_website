import { Link } from 'react-router-dom'
import { TrashIcon, MinusIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '../stores/cartStore'
import { useState } from 'react'
import toast from 'react-hot-toast'

const CartPage = () => {
  const { 
    items, 
    subtotal, 
    discount, 
    shipping, 
    total, 
    coupon,
    updateItem, 
    removeItem, 
    applyCoupon,
    removeCoupon,
    clearCart,
    isLoading 
  } = useCartStore()
  
  const [couponCode, setCouponCode] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    if (!couponCode.trim()) return
    
    setApplyingCoupon(true)
    try {
      await applyCoupon(couponCode)
      toast.success('Coupon applied successfully!')
      setCouponCode('')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid coupon code')
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = async () => {
    await removeCoupon()
    toast.success('Coupon removed')
  }

  if (items.length === 0) {
    return (
      <div className="py-16">
        <div className="container-custom text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/products" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="section-title mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={(qty) => updateItem(item.id, qty)}
                onRemove={() => removeItem(item.id)}
                isLoading={isLoading}
              />
            ))}

            {/* Clear Cart */}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear your cart?')) {
                    clearCart()
                  }
                }}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              {/* Coupon Form */}
              {!coupon ? (
                <form onSubmit={handleApplyCoupon} className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have a coupon?
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="input pl-10"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="btn-outline px-4"
                    >
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-700">{coupon.code}</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Summary */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-Rs. {discount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'Free' : `Rs. ${shipping.toLocaleString()}`}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className="text-xs text-gray-500">
                    Add Rs. {(5000 - subtotal).toLocaleString()} more for free shipping
                  </p>
                )}
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>Rs. {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                to="/checkout"
                className="block w-full btn-primary text-center mt-6"
              >
                Proceed to Checkout
              </Link>

              {/* Continue Shopping */}
              <Link
                to="/products"
                className="block w-full text-center mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Cart Item Component
const CartItem = ({ item, onUpdateQuantity, onRemove, isLoading }) => {
  const product = item.product

  return (
    <div className="flex gap-4 p-4 bg-white rounded-xl border">
      {/* Image */}
      <Link to={`/products/${product.slug}`} className="flex-shrink-0">
        <img
          src={product.image || '/images/placeholder.jpg'}
          alt={product.name}
          className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <div>
            <Link 
              to={`/products/${product.slug}`}
              className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-2"
            >
              {product.name}
            </Link>
            {product.category && (
              <p className="text-sm text-gray-500 mt-1">{product.category.name}</p>
            )}
          </div>
          <button
            onClick={onRemove}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove item"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || isLoading}
              className="p-2 hover:bg-gray-100 disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="px-4 font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-lg font-semibold text-primary-600">
              Rs. {((product.sale_price || product.price) * item.quantity).toLocaleString()}
            </p>
            {item.quantity > 1 && (
              <p className="text-sm text-gray-500">
                Rs. {(product.sale_price || product.price).toLocaleString()} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
