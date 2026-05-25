/**
 * Product Card Component - Dreamy Fairytale Design
 * Elegant jewelry cards with butterfly signature and sparkle effects
 */
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useState } from 'react';
import LazyImage from './LazyImage';

// Small Butterfly Accent
const ButterflyAccent = ({ className = "" }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10C10 10 6 6 3 6C1 6 0 8 0 10C0 12 1 14 3 14C6 14 10 10 10 10Z" 
          fill="url(#bf-left)" stroke="#B76E79" strokeWidth="0.3"/>
    <path d="M10 10C10 10 14 6 17 6C19 6 20 8 20 10C20 12 19 14 17 14C14 14 10 10 10 10Z" 
          fill="url(#bf-right)" stroke="#B76E79" strokeWidth="0.3"/>
    <ellipse cx="10" cy="10" rx="0.8" ry="2.5" fill="#B76E79"/>
    <defs>
      <linearGradient id="bf-left" x1="0" y1="6" x2="10" y2="14">
        <stop offset="0%" stopColor="#F7E7CE"/><stop offset="100%" stopColor="#CE9B9B"/>
      </linearGradient>
      <linearGradient id="bf-right" x1="20" y1="6" x2="10" y2="14">
        <stop offset="0%" stopColor="#F7E7CE"/><stop offset="100%" stopColor="#B76E79"/>
      </linearGradient>
    </defs>
  </svg>
);

const ProductCard = ({ product }) => {
  const { addItem } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding) return;
    
    setIsAdding(true);
    try {
      await addItem(product.id, 1);
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <Link 
      to={`/product/${product.slug}`} 
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div 
        className="relative aspect-[3/4] overflow-hidden rounded-2xl mb-4"
        style={{ backgroundColor: '#F8E8E8' }}
      >
        <LazyImage
          src={product.image || '/placeholder-product.jpg'}
          alt={product.name}
          aspectRatio="portrait"
          className="w-full h-full object-cover transition-all duration-700 ease-out
                   group-hover:scale-105"
        />
        
        {/* Subtle gradient overlay on hover */}
        <div 
          className={`absolute inset-0 transition-opacity duration-500 pointer-events-none
                     ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            background: 'linear-gradient(to top, rgba(183,110,121,0.15) 0%, transparent 50%)'
          }}
        />

        {/* Butterfly Badge for New Arrivals */}
        {product.is_new_arrival && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm
                        px-3 py-1.5 rounded-full shadow-sm">
            <ButterflyAccent className="w-4 h-4" />
            <span 
              className="text-[10px] uppercase tracking-[0.1em]"
              style={{ color: '#B76E79', fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
            >
              New
            </span>
          </div>
        )}

        {/* Heart Button - Always visible, top right */}
        <button
          onClick={handleLike}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 backdrop-blur-sm shadow-sm
                    ${isLiked 
                      ? 'bg-rose-500 text-white scale-110' 
                      : 'bg-white/90 text-rose-400 hover:bg-rose-500 hover:text-white hover:scale-110'
                    }`}
          style={{ 
            boxShadow: isLiked ? '0 4px 15px rgba(183, 110, 121, 0.4)' : '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          <Heart 
            className={`w-4 h-4 transition-all duration-300 ${isLiked ? 'fill-current' : ''}`} 
            strokeWidth={2} 
          />
        </button>

        {/* Sale Badge with sparkle */}
        {product.is_on_sale && product.discount_percent > 0 && (
          <div 
            className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{ 
              background: 'linear-gradient(135deg, #D4A574 0%, #B76E79 100%)',
              boxShadow: '0 4px 15px rgba(212, 165, 116, 0.4)'
            }}
          >
            <Sparkles className="w-3 h-3 text-white" />
            <span 
              className="text-[10px] uppercase tracking-wider text-white font-semibold"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              {Math.round(product.discount_percent)}% Off
            </span>
          </div>
        )}

        {/* Quick Add Button - Slides up on hover */}
        <div 
          className={`absolute bottom-0 left-0 right-0 p-4 
                     transition-all duration-500 transform
                     ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !product.in_stock}
            className="w-full py-3.5 px-4 rounded-full flex items-center justify-center gap-2
                     transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed
                     hover:shadow-lg hover:scale-[1.02]"
            style={{ 
              background: product.in_stock 
                ? 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 100%)' 
                : '#CCCCCC',
              color: 'white',
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 600,
              fontSize: '12px',
              letterSpacing: '0.1em',
              boxShadow: product.in_stock ? '0 6px 20px rgba(183, 110, 121, 0.35)' : 'none'
            }}
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent 
                            rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" strokeWidth={2} />
                {!product.in_stock ? 'SOLD OUT' : 'ADD TO BAG'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-2 px-1">
        {/* Category with sparkle */}
        <p 
          className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-1"
          style={{ color: '#CE9B9B', fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}
        >
          <span style={{ color: '#D4A574', fontSize: '8px' }}>✦</span>
          {product.category?.name || 'Jewelry'}
        </p>

        {/* Product Name */}
        <h3 
          className="text-lg group-hover:text-rose-600 transition-colors duration-300 leading-tight"
          style={{ 
            fontFamily: "'Playfair Display', serif", 
            fontWeight: 500,
            color: '#2D2D2D'
          }}
        >
          {product.name}
        </h3>

        {/* Price with elegant styling */}
        <div className="flex items-center gap-3 pt-1">
          {product.is_on_sale && product.sale_price ? (
            <>
              <span 
                className="text-base font-semibold"
                style={{ 
                  color: '#B76E79',
                  fontFamily: "'Quicksand', sans-serif"
                }}
              >
                Rs. {Number(product.sale_price).toLocaleString()}
              </span>
              <span 
                className="text-sm line-through"
                style={{ color: '#AAAAAA', fontFamily: "'Quicksand', sans-serif" }}
              >
                Rs. {Number(product.price).toLocaleString()}
              </span>
            </>
          ) : (
            <span 
              className="text-base font-semibold"
              style={{ 
                color: '#2D2D2D',
                fontFamily: "'Quicksand', sans-serif"
              }}
            >
              Rs. {Number(product.price).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;