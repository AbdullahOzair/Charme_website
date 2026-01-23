/**
 * Product Card Component - Minimal handmade aesthetic
 */
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useState } from 'react';
import LazyImage from './LazyImage';

const ProductCard = ({ product }) => {
  const { addItem } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding) return;
    
    setIsAdding(true);
    try {
      const result = await addItem(product.id, 1);
      if (!result.success) {
        // Error toast already shown by store
      }
    } catch (error) {
      // Error handling is done in the store
      console.error('Add to cart error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link to={`/product/${product.slug}`} className="group block fade-in">
      <div className="card overflow-hidden hover-lift">
        {/* Image Container */}
        <div className="relative overflow-hidden bg-neutral-50">
          <LazyImage
            src={product.image || '/placeholder-product.jpg'}
            alt={product.name}
            aspectRatio="square"
            className="group-hover:scale-105 transition-transform duration-700"
          />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.is_new_arrival && (
              <span className="badge-new">New</span>
            )}
            {product.is_on_sale && product.discount_percent > 0 && (
              <span className="badge-sale">-{Math.round(product.discount_percent)}% OFF</span>
            )}
            {product.is_bestseller && (
              <span className="badge-bestseller">Bestseller</span>
            )}
          </div>

          {/* Wishlist Button */}
          <button 
            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-sm shadow-sm 
                     hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast('Wishlist feature coming soon!');
            }}
          >
            <Heart className="w-4 h-4 text-neutral-700" />
          </button>

          {/* Quick Add Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || !product.in_stock}
              className="w-full bg-white text-neutral-900 py-2.5 px-4 rounded-sm text-sm font-medium
                       hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  {!product.in_stock ? 'Out of Stock' : 'Quick Add'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-5">
          {/* Category */}
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 font-medium">
            {product.category?.name || 'Handmade'}
          </p>

          {/* Product Name */}
          <h3 className="font-medium text-neutral-900 mb-3 line-clamp-2 leading-snug
                       group-hover:text-neutral-600 transition-colors" 
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.125rem' }}>
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            {product.is_on_sale && product.sale_price ? (
              <>
                <span className="text-lg font-semibold text-red-600">
                  Rs. {Number(product.sale_price).toLocaleString()}
                </span>
                <span className="text-sm text-neutral-400 line-through">
                  Rs. {Number(product.price).toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-lg font-semibold text-neutral-900">
                Rs. {Number(product.price).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

