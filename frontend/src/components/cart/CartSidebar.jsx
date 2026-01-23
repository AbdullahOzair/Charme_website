import { Link } from 'react-router-dom'
import { XMarkIcon, MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '../../stores/cartStore'
import { useUIStore } from '../../stores/uiStore'

const CartSidebar = () => {
  const { items, subtotal, discount, shipping, total, itemCount, updateItem, removeItem, isLoading } = useCartStore()
  const { closeCart } = useUIStore()

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Shopping Cart ({itemCount})
          </h2>
          <button 
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close cart"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="btn-primary"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem 
                  key={item.id} 
                  item={item} 
                  onUpdateQuantity={(qty) => updateItem(item.id, qty)}
                  onRemove={() => removeItem(item.id)}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-Rs. {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{shipping === 0 ? 'Free' : `Rs. ${shipping.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t">
                <span>Total</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                to="/checkout"
                onClick={closeCart}
                className="block w-full btn-primary text-center"
              >
                Checkout
              </Link>
              <Link
                to="/cart"
                onClick={closeCart}
                className="block w-full btn-outline text-center"
              >
                View Cart
              </Link>
            </div>

            {/* Free Shipping Notice */}
            {subtotal < 5000 && (
              <p className="text-center text-sm text-gray-500">
                Add Rs. {(5000 - subtotal).toLocaleString()} more for free shipping!
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// Cart Item Component
const CartItem = ({ item, onUpdateQuantity, onRemove, isLoading }) => {
  const product = item.product

  return (
    <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
      {/* Image */}
      <Link to={`/products/${product.slug}`} className="flex-shrink-0">
        <img
          src={product.image || '/images/placeholder.jpg'}
          alt={product.name}
          className="w-20 h-20 object-cover rounded-lg"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link 
          to={`/products/${product.slug}`}
          className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
        >
          {product.name}
        </Link>
        
        <p className="text-primary-600 font-semibold mt-1">
          Rs. {(product.sale_price || product.price)?.toLocaleString()}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || isLoading}
              className="p-1.5 hover:bg-gray-100 disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              disabled={isLoading}
              className="p-1.5 hover:bg-gray-100 disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={onRemove}
            disabled={isLoading}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
            aria-label="Remove item"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartSidebar
