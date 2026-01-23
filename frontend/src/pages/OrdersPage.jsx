import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { orderService } from '../services/orderService'

const OrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const data = await orderService.getOrders(params)
      setOrders(data.results || data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const filters = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="section-title mb-8">My Orders</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
            <Link to="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.order_number}`}
                className="block bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        Order #{order.order_number}
                      </h3>
                      <span className={`badge ${statusColors[order.status]}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    Rs. {order.total?.toLocaleString()}
                  </p>
                </div>

                {/* Order Items Preview */}
                <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-2">
                  {order.items?.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img
                        src={item.product?.image || '/images/placeholder.jpg'}
                        alt={item.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                  {order.items?.length > 4 && (
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                  </p>
                  <span className="text-primary-600 font-medium text-sm">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage
