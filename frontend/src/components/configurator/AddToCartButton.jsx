// frontend/src/components/configurator/AddToCartButton.jsx
import { useState } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useConfiguratorStore from '../../stores/configuratorStore';
import { addToCart } from '../../services/designService';

/**
 * Header-bar button for adding the current design to the cart.
 *
 * Flow:
 *   1. If savedDesignId is null  → calls onNeedSave() so Configurator opens SaveDesignModal.
 *   2. If savedDesignId exists   → POSTs to /api/v1/cart/items/, toasts, redirects to /cart.
 */
const AddToCartButton = ({ onNeedSave }) => {
  const savedDesignId = useConfiguratorStore((s) => s.savedDesignId);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!savedDesignId) {
      onNeedSave?.();
      return;
    }

    setLoading(true);
    try {
      await addToCart(savedDesignId);
      toast.success('Added to cart!');
      navigate('/cart');
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? 'Please log in to add items to cart.'
          : err.response?.data?.detail ??
            err.response?.data?.error ??
            'Failed to add to cart.';
      toast.error(msg);
      console.error('AddToCartButton:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={savedDesignId ? 'Add to cart' : 'Save your design first'}
      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-500"
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline">Adding…</span>
        </>
      ) : (
        <>
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {savedDesignId ? 'Add to Cart' : 'Save & Cart'}
          </span>
        </>
      )}
    </button>
  );
};

export default AddToCartButton;
