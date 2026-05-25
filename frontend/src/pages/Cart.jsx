/**
 * Cart Page
 */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../stores/cartStore';
import useAuthStore from '../stores/authStore';
import { TrashIcon, MinusIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { items, totalPrice, fetchCart, updateItem, removeItem, isLoading } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateItem(itemId, newQuantity);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="animate-shimmer h-96 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some beautiful bracelets to your cart</p>
          <Link to="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-display font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) =>
              item.item_type === 'custom_design'
                ? <CustomDesignCartItem key={item.id} item={item} onRemove={removeItem} />
                : <RegularCartItem key={item.id} item={item} onQtyChange={handleQuantityChange} onRemove={removeItem} />
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rs. {(totalPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>Rs. {(totalPrice || 0).toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handleCheckout} className="btn-primary w-full">
                Proceed to Checkout
              </button>

              <Link to="/shop" className="btn-outline w-full mt-3">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Regular product cart item ───────────────────────────────────────────────
const RegularCartItem = ({ item, onQtyChange, onRemove }) => (
  <div className="card p-6">
    <div className="flex gap-6">
      <img
        src={item.product_image || '/placeholder-product.jpg'}
        alt={item.product_name || 'Product'}
        className="w-24 h-24 object-cover rounded-lg bg-gray-100"
        onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
      />
      <div className="flex-1">
        <span className="font-semibold text-gray-900">{item.product_name || 'Product'}</span>
        <div className="mt-1">
          {item.is_on_sale && item.original_price ? (
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-medium">Rs. {item.product_price || '0'}</span>
              <span className="text-gray-400 line-through text-sm">Rs. {item.original_price}</span>
              {item.discount_percent && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">
                  -{item.discount_percent}%
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-600 text-sm">Rs. {item.product_price || '0'}</span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <button onClick={() => onQtyChange(item.id, item.quantity - 1)} className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50">
              <MinusIcon className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-medium">{item.quantity}</span>
            <button onClick={() => onQtyChange(item.id, item.quantity + 1)} className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50">
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => onRemove(item.id)} className="text-red-600 hover:text-red-700 flex items-center gap-1">
            <TrashIcon className="w-5 h-5" />Remove
          </button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-lg">Rs. {item.subtotal || '0'}</p>
      </div>
    </div>
  </div>
);

// ─── Custom design cart item ──────────────────────────────────────────────────
const CustomDesignCartItem = ({ item, onRemove }) => {
  const d = item.design_details || {};
  const fmt = (v) => Number(v).toLocaleString('en-PK');

  return (
    <div className="card p-6 border-l-4 border-l-rose-400">
      <div className="flex gap-6">
        {/* Preview image */}
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
          {item.product_image ? (
            <img src={item.product_image} alt="Design preview" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              <SparklesIcon className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{item.product_name}</span>
            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
              Custom Design
            </span>
          </div>

          {/* Specs grid */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-gray-600">
            {d.bracelet_length_cm && (
              <div>
                <span className="font-medium text-gray-700">Length: </span>
                {d.bracelet_length_cm} cm
              </div>
            )}
            {d.bead_count > 0 && (
              <div>
                <span className="font-medium text-gray-700">Beads: </span>
                {d.bead_count}
              </div>
            )}
            {d.charm_count > 0 && (
              <div>
                <span className="font-medium text-gray-700">Charms: </span>
                {d.charm_count}
              </div>
            )}
            {d.chain?.name && (
              <div>
                <span className="font-medium text-gray-700">Chain: </span>
                {d.chain.name}
              </div>
            )}
            {d.material && (
              <div>
                <span className="font-medium text-gray-700">Material: </span>
                {d.material}
              </div>
            )}
            {d.color?.name && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-700">Color: </span>
                <span
                  className="inline-block w-3 h-3 rounded-full border border-gray-300"
                  style={{ background: d.color.hex }}
                />
                {d.color.name}
              </div>
            )}
          </div>

          {/* Bead breakdown */}
          {d.beads?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700 mb-1">Bead breakdown:</p>
              <div className="flex flex-wrap gap-1.5">
                {d.beads.map((b, i) => (
                  <span key={i} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                    {b.name} ×{b.count} — Rs. {fmt(b.subtotal)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Price breakdown */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {d.chain?.price && (
              <span>Chain: Rs. {fmt(d.chain.price)}</span>
            )}
            {d.charms?.map((c, i) => (
              <span key={i}>{c.name} ×{c.count}: Rs. {fmt(c.subtotal)}</span>
            ))}
          </div>

          <button
            onClick={() => onRemove(item.id)}
            className="mt-4 text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
          >
            <TrashIcon className="w-4 h-4" />Remove
          </button>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-lg">Rs. {fmt(item.subtotal)}</p>
          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;

