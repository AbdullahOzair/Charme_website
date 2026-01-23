import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { CheckCircleIcon, TruckIcon, CubeIcon, ClockIcon } from '@heroicons/react/24/outline'
import { orderService } from '../services/orderService'
import toast from 'react-hot-toast'

const OrderDetailPage = () => {
  const { orderNumber } = useParams()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const isSuccess = searchParams.get('success') === 'true'

  useEffect(() => {
    fetchOrder()
  }, [orderNumber])

  const fetchOrder = async () => {
    try {
      const data = await orderService.getOrderByNumber(orderNumber)
      setOrder(data)
    } catch (error) {
      console.error('Failed to fetch order:', error)
      toast.error('Order not found')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    
    try {
      await orderService.cancelOrder(order.id)
      toast.success('Order cancelled successfully')
      fetchOrder()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel order')
    }
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: ClockIcon },
    { key: 'processing', label: 'Processing', icon: CubeIcon },
    { key: 'shipped', label: 'Shipped', icon: TruckIcon },
    { key: 'delivered', label: 'Delivered', icon: CheckCircleIcon },
  ]

  const getStepStatus = (stepKey) => {
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered']
    const currentIndex = statusOrder.indexOf(order?.status)
    const stepIndex = statusOrder.indexOf(stepKey)
    
    if (order?.status === 'cancelled') return 'cancelled'
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'upcoming'
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Order Not Found</h1>
        <Link to="/orders" className="btn-primary">View All Orders</Link>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Success Message */}
        {isSuccess && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
            <CheckCircleIcon className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold text-green-800 mb-2">
              Order Placed Successfully!
            </h2>
            <p className="text-green-600">
              Thank you for your order. We'll send you an email confirmation shortly.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Order #{order.order_number}
            </h1>
            <p className="text-gray-500 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex gap-3">
            {order.status === 'pending' && (
              <button
                onClick={handleCancelOrder}
                className="btn-outline text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
              >
                Cancel Order
              </button>
            )}
            <Link to="/orders" className="btn-outline">
              Back to Orders
            </Link>
          </div>
        </div>

        {/* Order Status Timeline */}
        {order.status !== 'cancelled' && (
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h2 className="font-semibold mb-6">Order Status</h2>
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
                <div 
                  className="h-full bg-primary-600 transition-all duration-500"
                  style={{
                    width: `${(statusSteps.findIndex(s => s.key === order.status) / (statusSteps.length - 1)) * 100}%`
                  }}
                />
              </div>
              
              {statusSteps.map((step) => {
                const status = getStepStatus(step.key)
                return (
                  <div key={step.key} className="relative flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                      status === 'completed' ? 'bg-primary-600 text-white' :
                      status === 'current' ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className={`mt-2 text-sm font-medium ${
                      status === 'completed' || status === 'current' ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cancelled Status */}
        {order.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <p className="text-red-800 font-medium">This order has been cancelled.</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.product?.image || '/images/placeholder.jpg'}
                      alt={item.product?.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <Link 
                        to={`/products/${item.product?.slug}`}
                        className="font-medium hover:text-primary-600"
                      >
                        {item.product?.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        Qty: {item.quantity} × Rs. {item.price?.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold">
                      Rs. {(item.quantity * item.price)?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-4">Payment Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>Rs. {order.subtotal?.toLocaleString()}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-Rs. {order.discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{order.shipping === 0 ? 'Free' : `Rs. ${order.shipping?.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold text-base">
                  <span>Total</span>
                  <span>Rs. {order.total?.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium capitalize">{order.payment_method?.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-4">Shipping Address</h2>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">{order.shipping_address?.full_name}</p>
                <p>{order.shipping_address?.address_line1}</p>
                {order.shipping_address?.address_line2 && (
                  <p>{order.shipping_address?.address_line2}</p>
                )}
                <p>
                  {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}
                </p>
                <p className="mt-2">{order.shipping_address?.phone}</p>
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-semibold mb-4">Order Notes</h2>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailPage
