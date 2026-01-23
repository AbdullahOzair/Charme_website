import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CreditCardIcon, 
  TruckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'
import { orderService } from '../services/orderService'
import { paymentService } from '../services/paymentService'
import toast from 'react-hot-toast'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { items, subtotal, discount, shipping, total, coupon, clearCart } = useCartStore()
  const { user } = useAuthStore()
  
  const [step, setStep] = useState(1)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newAddress, setNewAddress] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
    phone: user?.phone || '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: false,
  })
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')

  useEffect(() => {
    fetchAddresses()
  }, [])

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart')
    }
  }, [items, navigate])

  const fetchAddresses = async () => {
    try {
      const data = await authService.getAddresses()
      const addressList = data.results || data
      setAddresses(addressList)
      
      // Select default address
      const defaultAddr = addressList.find(a => a.is_default_shipping)
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id)
      } else if (addressList.length > 0) {
        setSelectedAddress(addressList[0].id)
      }
    } catch {
      console.error('Failed to fetch addresses')
    }
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    try {
      const data = await authService.addAddress(newAddress)
      setAddresses([...addresses, data])
      setSelectedAddress(data.id)
      setShowNewAddressForm(false)
      setNewAddress({
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        is_default: false,
      })
      toast.success('Address added successfully')
    } catch (error) {
      toast.error('Failed to add address')
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address')
      return
    }

    setIsSubmitting(true)
    try {
      // Create order
      const orderData = {
        shipping_address_id: selectedAddress,
        billing_address_id: selectedAddress,
        payment_method: paymentMethod,
        notes: orderNotes,
        coupon_code: coupon?.code,
      }

      const order = await orderService.createOrder(orderData)

      // Handle payment based on method
      if (paymentMethod === 'stripe') {
        const paymentIntent = await paymentService.createPaymentIntent(order.id)
        // Redirect to Stripe checkout or handle with Stripe Elements
        window.location.href = paymentIntent.checkout_url
      } else if (paymentMethod === 'cod') {
        await paymentService.processCOD(order.id)
        await clearCart()
        navigate(`/orders/${order.order_number}?success=true`)
        toast.success('Order placed successfully!')
      } else if (paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') {
        // Handle mobile wallet payments
        navigate(`/orders/${order.order_number}?payment=${paymentMethod}`)
      }
    } catch (error) {
      console.error('Order failed:', error)
      toast.error(error.response?.data?.detail || 'Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const paymentMethods = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      icon: '💵',
    },
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, etc.',
      icon: '💳',
    },
    {
      id: 'easypaisa',
      name: 'EasyPaisa',
      description: 'Pay with EasyPaisa mobile wallet',
      icon: '📱',
    },
    {
      id: 'jazzcash',
      name: 'JazzCash',
      description: 'Pay with JazzCash mobile wallet',
      icon: '📱',
    },
  ]

  const selectedAddressData = addresses.find(a => a.id === selectedAddress)

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="section-title mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {[
            { num: 1, label: 'Shipping' },
            { num: 2, label: 'Payment' },
            { num: 3, label: 'Review' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <button
                onClick={() => step > s.num && setStep(s.num)}
                disabled={step < s.num}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                  step >= s.num
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.num ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  s.num
                )}
              </button>
              <span className={`ml-2 hidden sm:inline ${
                step >= s.num ? 'text-gray-900 font-medium' : 'text-gray-500'
              }`}>
                {s.label}
              </span>
              {idx < 2 && (
                <div className={`w-12 sm:w-24 h-1 mx-4 rounded ${
                  step > s.num ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TruckIcon className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-semibold">Shipping Address</h2>
                </div>

                {/* Saved Addresses */}
                {addresses.length > 0 && !showNewAddressForm && (
                  <div className="space-y-3 mb-6">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddress === address.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddress === address.id}
                          onChange={() => setSelectedAddress(address.id)}
                          className="mt-1 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <p className="font-medium">{address.full_name}</p>
                          <p className="text-gray-600 text-sm">
                            {address.address_line1}
                            {address.address_line2 && `, ${address.address_line2}`}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {address.city}, {address.state} {address.postal_code}
                          </p>
                          <p className="text-gray-600 text-sm">{address.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Add New Address Button */}
                {!showNewAddressForm && (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="btn-outline w-full"
                  >
                    + Add New Address
                  </button>
                )}

                {/* New Address Form */}
                {showNewAddressForm && (
                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Full Name</label>
                        <input
                          type="text"
                          value={newAddress.full_name}
                          onChange={(e) => setNewAddress({...newAddress, full_name: e.target.value})}
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Phone Number</label>
                        <input
                          type="tel"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                          className="input"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="label">Address Line 1</label>
                      <input
                        type="text"
                        value={newAddress.address_line1}
                        onChange={(e) => setNewAddress({...newAddress, address_line1: e.target.value})}
                        className="input"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="label">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={newAddress.address_line2}
                        onChange={(e) => setNewAddress({...newAddress, address_line2: e.target.value})}
                        className="input"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">City</label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">State/Province</label>
                        <input
                          type="text"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Postal Code</label>
                        <input
                          type="text"
                          value={newAddress.postal_code}
                          onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})}
                          className="input"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button type="submit" className="btn-primary">
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="btn-ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Continue Button */}
                {!showNewAddressForm && selectedAddress && (
                  <button
                    onClick={() => setStep(2)}
                    className="btn-primary w-full mt-6"
                  >
                    Continue to Payment
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCardIcon className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === method.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="btn-ghost"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="btn-primary flex-1"
                  >
                    Continue to Review
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review Order */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Shipping Info */}
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Shipping Address</h3>
                    <button
                      onClick={() => setStep(1)}
                      className="text-primary-600 text-sm hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  {selectedAddressData && (
                    <div className="text-gray-600">
                      <p className="font-medium text-gray-900">{selectedAddressData.full_name}</p>
                      <p>{selectedAddressData.address_line1}</p>
                      {selectedAddressData.address_line2 && <p>{selectedAddressData.address_line2}</p>}
                      <p>{selectedAddressData.city}, {selectedAddressData.state} {selectedAddressData.postal_code}</p>
                      <p>{selectedAddressData.phone}</p>
                    </div>
                  )}
                </div>

                {/* Payment Info */}
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Payment Method</h3>
                    <button
                      onClick={() => setStep(2)}
                      className="text-primary-600 text-sm hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p>{paymentMethods.find(m => m.id === paymentMethod)?.name}</p>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <img
                          src={item.product.image || '/images/placeholder.jpg'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">
                          Rs. {((item.product.sale_price || item.product.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Notes */}
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold mb-4">Order Notes (Optional)</h3>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Special instructions for delivery..."
                    className="input min-h-[100px]"
                  />
                </div>

                {/* Place Order Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="btn-ghost"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="btn-primary flex-1"
                  >
                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative">
                      <img
                        src={item.product.image || '/images/placeholder.jpg'}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded"
                      />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-sm text-gray-500">
                        Rs. {(item.product.sale_price || item.product.price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t pt-4">
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
                <div className="flex justify-between text-lg font-semibold border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
