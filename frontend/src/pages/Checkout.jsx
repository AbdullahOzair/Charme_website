/**
 * Checkout Page with complete pricing breakdown and coupon support
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCartStore from '../stores/cartStore';
import useAuthStore from '../stores/authStore';
import { orderService, paymentService, cartService } from '../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { clearCart, fetchCart, isLoading } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cartLoaded, setCartLoaded] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  // Pricing state from backend
  const [pricing, setPricing] = useState({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    freeShippingThreshold: 2000,
    total: 0
  });
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    notes: '',
  });

  // Cart items from backend summary (source of truth)
  const [cartItems, setCartItems] = useState([]);

  // Fetch cart summary with pricing
  const fetchCartSummary = async (coupon = '') => {
    try {
      const response = await cartService.getSummary(coupon);
      const data = response.data.data;
      
      // Set items from backend (source of truth)
      setCartItems(data.items || []);
      
      setPricing({
        subtotal: parseFloat(data.subtotal) || 0,
        discount: parseFloat(data.discount) || 0,
        shipping: parseFloat(data.shipping_cost) || 0,
        freeShippingThreshold: parseFloat(data.free_shipping_threshold) || 2000,
        total: parseFloat(data.total) || 0
      });
      
      if (data.coupon) {
        setAppliedCoupon(data.coupon);
      }
      
      return data.items || [];
    } catch (error) {
      console.error('Error fetching cart summary:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadCart = async () => {
      await fetchCart(); // Update header cart count
      const items = await fetchCartSummary();
      setCartLoaded(true);
      
      // Redirect if cart is actually empty
      if (items.length === 0) {
        toast.error('Your cart is empty. Please add items first.');
        navigate('/cart');
      }
    };
    loadCart();
  }, [fetchCart, navigate]);

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setCouponLoading(true);
    setCouponError('');
    
    try {
      const response = await cartService.applyCoupon(couponCode);
      if (response.data.success) {
        setAppliedCoupon(response.data.data.coupon);
        await fetchCartSummary(couponCode);
        toast.success('Coupon applied successfully!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Invalid coupon code';
      setCouponError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = async () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    await fetchCartSummary();
    toast.success('Coupon removed');
  };

  if (!cartLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Please add items to your cart before checkout</p>
          <Link to="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Re-fetch cart summary to verify items still exist
    const freshItems = await fetchCartSummary(appliedCoupon?.code || '');
    
    if (freshItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }
    
    setLoading(true);

    try {
      const orderData = {
        shipping_name: `${formData.first_name} ${formData.last_name}`,
        shipping_address: `${formData.address}, ${formData.state} ${formData.postal_code}`,
        shipping_city: formData.city,
        shipping_phone: formData.phone,
        notes: formData.notes || '',
        coupon_code: appliedCoupon?.code || '',
      };

      const orderResponse = await orderService.create(orderData);
      const orderId = orderResponse.data.id;

      let paymentResponse;

      switch (paymentMethod) {
        case 'easypaisa':
          paymentResponse = await paymentService.createEasyPaisaPayment(orderId, formData.phone);
          window.location.href = paymentResponse.data.redirect_url;
          break;

        case 'jazzcash':
          paymentResponse = await paymentService.createJazzCashPayment(orderId, formData.phone);
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = paymentResponse.data.post_url;
          Object.entries(paymentResponse.data.form_data).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
          });
          document.body.appendChild(form);
          form.submit();
          break;

        case 'cod':
          await paymentService.createCODPayment(orderId, formData.phone, formData.notes);
          await clearCart();
          toast.success('Order placed successfully!');
          navigate(`/orders`);
          break;

        case 'stripe':
          paymentResponse = await paymentService.createStripePayment(orderId);
          toast.info('Stripe payment integration pending');
          break;

        default:
          toast.error('Invalid payment method');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || (error.response?.data && JSON.stringify(error.response.data))
        || 'Failed to process order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate original total (before product discounts)
  const originalSubtotal = cartItems.reduce((sum, item) => {
    const originalPrice = parseFloat(item.original_price || item.product_price) || 0;
    return sum + (originalPrice * item.quantity);
  }, 0);
  
  // Product discount savings
  const productDiscount = originalSubtotal - pricing.subtotal;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      className="input"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Street Address</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">City</label>
                      <input
                        type="text"
                        className="input"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input
                        type="text"
                        className="input"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Postal Code</label>
                      <input
                        type="text"
                        className="input"
                        required
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-gray-600">Pay when you receive</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="easypaisa"
                      checked={paymentMethod === 'easypaisa'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">EasyPaisa</p>
                      <p className="text-sm text-gray-600">Mobile wallet payment</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="jazzcash"
                      checked={paymentMethod === 'jazzcash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">JazzCash</p>
                      <p className="text-sm text-gray-600">Mobile wallet payment</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Notes */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Order Notes (Optional)</h2>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Any special instructions for your order..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary w-full py-4 text-lg" disabled={loading}>
                {loading ? 'Processing...' : `Place Order - Rs. ${pricing.total.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product_image || '/placeholder.jpg'}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-semibold text-sm">
                          Rs. {parseFloat(item.product_price || 0).toFixed(2)}
                        </span>
                        {item.is_on_sale && item.original_price && (
                          <span className="text-gray-400 text-xs line-through">
                            Rs. {parseFloat(item.original_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-sm">
                        Rs. {(parseFloat(item.product_price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code */}
              <div className="border-t pt-4 mb-4">
                <label className="label text-sm font-medium mb-2">Promo Code</label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div>
                      <span className="font-medium text-green-700">{appliedCoupon.code}</span>
                      <p className="text-sm text-green-600">
                        {appliedCoupon.discount_type === 'percentage' 
                          ? `${appliedCoupon.discount_value}% off`
                          : appliedCoupon.discount_type === 'free_shipping'
                          ? 'Free Shipping'
                          : `Rs. ${appliedCoupon.discount_value} off`
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="btn-secondary px-4"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-500 text-sm mt-1">{couponError}</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 space-y-3">
                {/* Original Price (if there's product discount) */}
                {productDiscount > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Original Price</span>
                    <span className="line-through">Rs. {originalSubtotal.toFixed(2)}</span>
                  </div>
                )}

                {/* Product Discount */}
                {productDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Product Discount</span>
                    <span>-Rs. {productDiscount.toFixed(2)}</span>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rs. {pricing.subtotal.toFixed(2)}</span>
                </div>

                {/* Coupon Discount */}
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-Rs. {pricing.discount.toFixed(2)}</span>
                  </div>
                )}

                {/* Shipping */}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  {pricing.shipping === 0 ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    <span>Rs. {pricing.shipping.toFixed(2)}</span>
                  )}
                </div>

                {/* Free shipping notice */}
                {pricing.shipping > 0 && pricing.subtotal < pricing.freeShippingThreshold && (
                  <p className="text-xs text-gray-500">
                    Add Rs. {(pricing.freeShippingThreshold - pricing.subtotal).toFixed(2)} more for free shipping
                  </p>
                )}

                {/* Total */}
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">Rs. {pricing.total.toFixed(2)}</span>
                </div>

                {/* Total Savings */}
                {(productDiscount + pricing.discount) > 0 && (
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <span className="text-green-700 font-medium">
                      🎉 You're saving Rs. {(productDiscount + pricing.discount).toFixed(2)}!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

