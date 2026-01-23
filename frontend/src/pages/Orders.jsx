/**
 * Orders Page - User Order History
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import { orderService } from '../services/api';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-5 h-5 text-yellow-600" />,
      processing: <Package className="w-5 h-5 text-blue-600" />,
      shipped: <Truck className="w-5 h-5 text-purple-600" />,
      delivered: <CheckCircle className="w-5 h-5 text-green-600" />,
      cancelled: <XCircle className="w-5 h-5 text-red-600" />,
    };
    return icons[status] || <Package className="w-5 h-5 text-gray-600" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="container-custom">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-4xl md:text-5xl font-light text-neutral-900 mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            My Orders
          </h1>
          <p className="text-neutral-600">View and track your order history</p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-xl font-medium text-neutral-900 mb-2">No Orders Yet</h3>
            <p className="text-neutral-600 mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link to="/shop" className="btn-primary inline-flex items-center">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="card p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  {/* Order Info */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-neutral-100 rounded-lg">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                        Order #{order.order_number}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        Placed on {formatDate(order.created_at)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {order.items?.length || 0} item(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="text-right">
                    <p className="text-sm text-neutral-600 mb-1">Total Amount</p>
                    <p className="text-2xl font-semibold text-neutral-900">
                      Rs. {Number(order.total).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="border-t border-neutral-200 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {order.items?.slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="w-12 h-12 rounded-lg bg-neutral-100 border-2 border-white overflow-hidden"
                        >
                          {item.product?.image && (
                            <img
                              src={item.product.image}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="w-12 h-12 rounded-lg bg-neutral-200 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-medium text-neutral-700">
                            +{order.items.length - 3}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn-outline text-sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 
                    className="text-3xl font-light text-neutral-900 mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    Order Details
                  </h2>
                  <p className="text-neutral-600">#{selectedOrder.order_number}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Order Status */}
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(selectedOrder.status)}
                  <div>
                    <p className="text-sm text-neutral-600">Order Status</p>
                    <p className="text-lg font-medium text-neutral-900 capitalize">
                      {selectedOrder.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-neutral-900 mb-3">Shipping Address</h3>
                <div className="p-4 bg-neutral-50 rounded-lg text-sm text-neutral-700">
                  <p className="font-medium text-neutral-900">{selectedOrder.shipping_name}</p>
                  <p className="mt-1">{selectedOrder.shipping_address}</p>
                  <p>{selectedOrder.shipping_city}</p>
                  <p className="mt-2">Phone: {selectedOrder.shipping_phone}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-neutral-900 mb-3">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
                      <div className="w-16 h-16 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product?.image && (
                          <img
                            src={item.product.image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{item.product_name}</p>
                        <p className="text-sm text-neutral-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900">
                          Rs. {Number(item.subtotal).toLocaleString()}
                        </p>
                        <p className="text-xs text-neutral-600">
                          Rs. {Number(item.product_price).toLocaleString()} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-neutral-200 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal</span>
                    <span className="text-neutral-900">Rs. {Number(selectedOrder.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Shipping</span>
                    <span className="text-neutral-900">Rs. {Number(selectedOrder.shipping_cost).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t border-neutral-200">
                    <span className="text-neutral-900">Total</span>
                    <span className="text-neutral-900">Rs. {Number(selectedOrder.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                  <p className="text-sm font-medium text-neutral-900 mb-1">Notes</p>
                  <p className="text-sm text-neutral-600">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
