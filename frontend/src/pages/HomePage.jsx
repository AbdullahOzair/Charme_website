/**
 * HomePage - Dreamy Fairytale Jewelry Brand
 * With butterfly signatures and magical sparkle effects
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Shield, Truck, Heart } from 'lucide-react'
import ProductGrid from '../components/products/ProductGrid'
import { productService } from '../services/productService'

// ✨ Detailed Butterfly Component for Brand Signature
const Butterfly = ({ className = "", style = {}, size = "md" }) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10", 
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  }
  
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      className={`${sizes[size]} ${className}`}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 16C16 16 10 10 5 9C2 8.5 0.5 11 0.5 14C0.5 17 2 20 5 20C10 19.5 16 16 16 16Z" 
            fill="url(#bf-hero-left)" stroke="#B76E79" strokeWidth="0.5"/>
      <path d="M16 16C16 16 22 10 27 9C30 8.5 31.5 11 31.5 14C31.5 17 30 20 27 20C22 19.5 16 16 16 16Z" 
            fill="url(#bf-hero-right)" stroke="#B76E79" strokeWidth="0.5"/>
      <path d="M16 16C16 16 11 18 7 21C4 23 4 26 6 27C8 28 11 27 14 24C16 21 16 16 16 16Z" 
            fill="url(#bf-hero-ll)" stroke="#D4A574" strokeWidth="0.3"/>
      <path d="M16 16C16 16 21 18 25 21C28 23 28 26 26 27C24 28 21 27 18 24C16 21 16 16 16 16Z" 
            fill="url(#bf-hero-lr)" stroke="#D4A574" strokeWidth="0.3"/>
      <ellipse cx="16" cy="16" rx="1.2" ry="5" fill="#B76E79"/>
      <path d="M15 11 Q14 8 12 7" stroke="#B76E79" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
      <path d="M17 11 Q18 8 20 7" stroke="#B76E79" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="0.8" fill="#D4A574"/>
      <circle cx="20" cy="7" r="0.8" fill="#D4A574"/>
      <defs>
        <linearGradient id="bf-hero-left" x1="0" y1="9" x2="16" y2="20">
          <stop offset="0%" stopColor="#F7E7CE"/><stop offset="50%" stopColor="#E8C4C4"/><stop offset="100%" stopColor="#CE9B9B"/>
        </linearGradient>
        <linearGradient id="bf-hero-right" x1="32" y1="9" x2="16" y2="20">
          <stop offset="0%" stopColor="#F7E7CE"/><stop offset="50%" stopColor="#E8C4C4"/><stop offset="100%" stopColor="#B76E79"/>
        </linearGradient>
        <linearGradient id="bf-hero-ll" x1="4" y1="16" x2="16" y2="28">
          <stop offset="0%" stopColor="#D4A574"/><stop offset="100%" stopColor="#CE9B9B"/>
        </linearGradient>
        <linearGradient id="bf-hero-lr" x1="28" y1="16" x2="16" y2="28">
          <stop offset="0%" stopColor="#D4A574"/><stop offset="100%" stopColor="#B76E79"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

// ✨ Sparkle/Glitter Component
const Sparkle = ({ style = {}, delay = 0 }) => (
  <span 
    className="absolute text-amber-300 animate-pulse pointer-events-none"
    style={{ 
      animationDelay: `${delay}s`,
      textShadow: '0 0 10px rgba(212, 165, 116, 0.8)',
      ...style 
    }}
  >
    ✦
  </span>
)

// ✨ Flying Butterfly Component (for Explore Collection hover)
const FlyingButterfly = ({ delay = 0, startX = 0, startY = 0 }) => (
  <div 
    className="absolute pointer-events-none animate-butterfly-fly"
    style={{ 
      left: `${startX}%`,
      top: `${startY}%`,
      animationDelay: `${delay}s`,
      animationDuration: '2s'
    }}
  >
    <Butterfly size="sm" className="opacity-80" />
  </div>
)

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [storyHovered, setStoryHovered] = useState(false)
  const [exploreHovered, setExploreHovered] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, arrivals, cats] = await Promise.all([
          productService.getFeaturedProducts(8),
          productService.getNewArrivals(4),
          productService.getCategories(),
        ])
        
        setFeaturedProducts(featured.results || featured)
        setNewArrivals(arrivals.results || arrivals)
        setCategories((cats.results || cats).slice(0, 3))
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div style={{ backgroundColor: '#FFFEF9' }}>
      {/* ✨ Hero Section - Dreamy Fairytale with Butterflies */}
      <section 
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #FFFEF9 0%, #F8E8E8 30%, #F7E7CE 70%, #E8C4C4 100%)'
        }}
      >
        {/* Floating Sparkles Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large decorative butterflies */}
          <Butterfly 
            size="xl" 
            className="absolute top-[10%] left-[5%] opacity-20 animate-butterfly"
            style={{ animationDuration: '4s' }}
          />
          <Butterfly 
            size="lg" 
            className="absolute top-[20%] right-[8%] opacity-25 animate-butterfly"
            style={{ animationDuration: '5s', animationDelay: '1s' }}
          />
          <Butterfly 
            size="md" 
            className="absolute bottom-[25%] left-[15%] opacity-20 animate-butterfly"
            style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}
          />
          <Butterfly 
            size="lg" 
            className="absolute bottom-[15%] right-[12%] opacity-15 animate-butterfly"
            style={{ animationDuration: '4.5s', animationDelay: '2s' }}
          />
          
          {/* Scattered sparkles */}
          <Sparkle style={{ top: '15%', left: '20%', fontSize: '16px' }} delay={0} />
          <Sparkle style={{ top: '25%', right: '25%', fontSize: '12px' }} delay={0.3} />
          <Sparkle style={{ top: '40%', left: '10%', fontSize: '14px' }} delay={0.6} />
          <Sparkle style={{ top: '60%', right: '15%', fontSize: '18px' }} delay={0.9} />
          <Sparkle style={{ top: '75%', left: '30%', fontSize: '10px' }} delay={1.2} />
          <Sparkle style={{ top: '20%', left: '60%', fontSize: '14px' }} delay={0.4} />
          <Sparkle style={{ top: '50%', right: '30%', fontSize: '12px' }} delay={0.7} />
          <Sparkle style={{ top: '80%', right: '40%', fontSize: '16px' }} delay={1} />
          <Sparkle style={{ top: '35%', left: '40%', fontSize: '8px' }} delay={0.2} />
          <Sparkle style={{ top: '65%', left: '70%', fontSize: '14px' }} delay={0.8} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Central Butterfly Signature */}
          <div className="flex justify-center mb-6">
            <Butterfly size="lg" className="animate-butterfly" />
          </div>
          
          <p 
            className="text-xs uppercase tracking-[0.4em] mb-6 flex items-center justify-center gap-3"
            style={{ color: '#B76E79', fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}
          >
            <span style={{ color: '#D4A574' }}>✦</span>
            Handcrafted with Love
            <span style={{ color: '#D4A574' }}>✦</span>
          </p>
          
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl mb-8 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
          >
            <span style={{ 
              background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 50%, #D4A574 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Jewelry That Tells
            </span>
            <br />
            <em 
              className="block mt-2"
              style={{ 
                fontFamily: "'Lora', serif",
                fontStyle: 'italic',
                fontWeight: 400,
                color: '#2D2D2D'
              }}
            >
              Your Story
            </em>
          </h1>

          <p 
            className="text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed"
            style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif", fontWeight: 400 }}
          >
            Each piece is thoughtfully designed and meticulously crafted to celebrate 
            the moments that matter most.
          </p>

          {/* CTA Buttons with Butterfly Magic */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            {/* Explore Collection - Multiple butterflies fly on hover */}
            <div 
              className="relative"
              onMouseEnter={() => setExploreHovered(true)}
              onMouseLeave={() => setExploreHovered(false)}
            >
              <Link 
                to="/shop" 
                className="inline-flex items-center justify-center px-10 py-4 rounded-full
                         text-xs uppercase tracking-[0.2em] text-white
                         transition-all duration-500 hover:scale-105 hover:shadow-2xl
                         relative overflow-hidden group"
                style={{ 
                  background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 100%)',
                  fontFamily: "'Quicksand', sans-serif",
                  fontWeight: 600,
                  boxShadow: '0 10px 40px rgba(183, 110, 121, 0.3)'
                }}
              >
                {/* Shimmer effect */}
                <span 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
                <Sparkles className="w-4 h-4 mr-2" />
                Explore Collection
              </Link>
              
              {/* Flying butterflies on hover */}
              {exploreHovered && (
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  <div className="absolute -top-4 left-1/4 animate-bounce" style={{ animationDuration: '0.8s' }}>
                    <Butterfly size="sm" className="opacity-90 -rotate-12" />
                  </div>
                  <div className="absolute -top-6 right-1/4 animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.2s' }}>
                    <Butterfly size="sm" className="opacity-80 rotate-12" />
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDuration: '0.9s', animationDelay: '0.1s' }}>
                    <Butterfly size="sm" className="opacity-85" />
                  </div>
                  <div className="absolute top-0 -left-4 animate-bounce" style={{ animationDuration: '1.1s', animationDelay: '0.3s' }}>
                    <Butterfly size="sm" className="opacity-70 -rotate-45" />
                  </div>
                  <div className="absolute top-0 -right-4 animate-bounce" style={{ animationDuration: '0.95s', animationDelay: '0.15s' }}>
                    <Butterfly size="sm" className="opacity-75 rotate-45" />
                  </div>
                </div>
              )}
            </div>

            {/* Our Story - Single butterfly lands on hover */}
            <div 
              className="relative"
              onMouseEnter={() => setStoryHovered(true)}
              onMouseLeave={() => setStoryHovered(false)}
            >
              <Link 
                to="/about" 
                className="inline-flex items-center justify-center px-10 py-4 rounded-full
                         text-xs uppercase tracking-[0.2em] border-2
                         transition-all duration-500 hover:scale-105 group"
                style={{ 
                  borderColor: '#B76E79',
                  color: '#B76E79',
                  fontFamily: "'Quicksand', sans-serif",
                  fontWeight: 600,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                Our Story
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              {/* Landing butterfly on hover */}
              <div 
                className={`absolute -top-6 right-2 transition-all duration-700 ease-out
                          ${storyHovered 
                            ? 'opacity-100 translate-y-0 rotate-0' 
                            : 'opacity-0 -translate-y-6 -rotate-45'}`}
              >
                <Butterfly size="md" className="drop-shadow-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator with sparkle */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center">
          <div 
            className="w-px h-16 mx-auto mb-3"
            style={{ background: 'linear-gradient(to bottom, #B76E79, transparent)' }}
          />
          <p 
            className="text-[10px] uppercase tracking-[0.3em] flex items-center gap-2"
            style={{ color: '#CE9B9B', fontFamily: "'Quicksand', sans-serif" }}
          >
            <span style={{ color: '#D4A574', fontSize: '8px' }}>✦</span>
            Scroll
            <span style={{ color: '#D4A574', fontSize: '8px' }}>✦</span>
          </p>
        </div>
      </section>

      {/* Brand Values - Elegant Strip with Dreamy Style */}
      <section style={{ borderTop: '1px solid #F8E8E8', borderBottom: '1px solid #F8E8E8', backgroundColor: '#FFFEF9' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderColor: '#F8E8E8' }}>
            <ValueItem icon={<Sparkles />} text="Handcrafted" color="#B76E79" />
            <ValueItem icon={<Shield />} text="Quality Assured" color="#CE9B9B" />
            <ValueItem icon={<Truck />} text="Free Shipping" color="#D4A574" />
            <ValueItem icon={<Heart />} text="Made with Love" color="#B76E79" />
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-24 md:py-32" style={{ backgroundColor: '#FFFEF9' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p 
              className="text-xs uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2"
              style={{ color: '#CE9B9B', fontFamily: "'Quicksand', sans-serif" }}
            >
              <span style={{ color: '#D4A574' }}>✦</span>
              Curated Selection
              <span style={{ color: '#D4A574' }}>✦</span>
            </p>
            <h2 
              className="text-4xl md:text-5xl"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: '#2D2D2D' }}
            >
              Featured Collections
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl animate-pulse" style={{ backgroundColor: '#F8E8E8' }}></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <CollectionCard 
                  key={category.id} 
                  category={category}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-24 md:py-32" style={{ backgroundColor: '#F8E8E8' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div>
              <p 
                className="text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2"
                style={{ color: '#CE9B9B', fontFamily: "'Quicksand', sans-serif" }}
              >
                <span style={{ color: '#D4A574' }}>✦</span>
                Just Arrived
              </p>
              <h2 
                className="text-4xl md:text-5xl"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: '#2D2D2D' }}
              >
                New Arrivals
              </h2>
            </div>
            <Link 
              to="/shop?sort=newest"
              className="mt-6 md:mt-0 inline-flex items-center text-xs uppercase tracking-[0.2em] 
                       hover:scale-105 transition-all group"
              style={{ color: '#B76E79', fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] rounded-2xl animate-pulse" style={{ backgroundColor: '#F7E7CE' }}></div>
                  <div className="h-4 rounded animate-pulse w-3/4" style={{ backgroundColor: '#E8C4C4' }}></div>
                  <div className="h-4 rounded animate-pulse w-1/2" style={{ backgroundColor: '#E8C4C4' }}></div>
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid products={newArrivals} columns={4} />
          )}
        </div>
      </section>

      {/* Editorial Image Section - Dreamy Overlay */}
      <section className="relative h-[80vh] overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1920&auto=format&fit=crop&q=80"
          alt="Jewelry craftsmanship"
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(183,110,121,0.4) 0%, rgba(212,165,116,0.3) 100%)' }}
        />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
            <div className="max-w-lg text-white relative">
              {/* Decorative butterfly */}
              <Butterfly size="md" className="absolute -top-8 -left-4 opacity-60 animate-butterfly" />
              
              <p 
                className="text-xs uppercase tracking-[0.3em] mb-6 flex items-center gap-2"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                <span style={{ color: '#F7E7CE' }}>✦</span>
                The Art of Craft
              </p>
              <h2 
                className="text-4xl md:text-5xl mb-6 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
              >
                Every Piece Has a Soul
              </h2>
              <p 
                className="text-base mb-8 leading-relaxed opacity-90"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                Our artisans pour their heart into every creation, ensuring each piece 
                carries the warmth of human touch and the precision of masterful craft.
              </p>
              <Link 
                to="/about"
                className="inline-flex items-center text-xs uppercase tracking-[0.2em] 
                         px-6 py-3 rounded-full transition-all duration-300
                         hover:scale-105 group"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  fontFamily: "'Quicksand', sans-serif",
                  fontWeight: 600
                }}
              >
                Discover Our Process
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products / Bestsellers */}
      <section className="py-24 md:py-32" style={{ backgroundColor: '#FFFEF9' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p 
              className="text-xs uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2"
              style={{ color: '#CE9B9B', fontFamily: "'Quicksand', sans-serif" }}
            >
              <span style={{ color: '#D4A574' }}>✦</span>
              Customer Favorites
              <span style={{ color: '#D4A574' }}>✦</span>
            </p>
            <h2 
              className="text-4xl md:text-5xl"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: '#2D2D2D' }}
            >
              Bestsellers
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] rounded-2xl animate-pulse" style={{ backgroundColor: '#F8E8E8' }}></div>
                  <div className="h-4 rounded animate-pulse w-3/4" style={{ backgroundColor: '#E8C4C4' }}></div>
                  <div className="h-4 rounded animate-pulse w-1/2" style={{ backgroundColor: '#E8C4C4' }}></div>
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid products={featuredProducts} columns={4} />
          )}

          <div className="text-center mt-12">
            <Link 
              to="/shop"
              className="inline-flex items-center justify-center px-10 py-4 rounded-full
                       text-xs uppercase tracking-[0.2em] border-2 
                       transition-all duration-300 hover:scale-105 group"
              style={{ 
                borderColor: '#B76E79',
                color: '#B76E79',
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 600
              }}
            >
              View All Products
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter CTA - Dreamy Style */}
      <section 
        className="py-24 md:py-32 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 50%, #D4A574 100%)' }}
      >
        {/* Background butterflies */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <Butterfly size="xl" className="absolute top-10 left-10 animate-butterfly" style={{ animationDuration: '5s' }} />
          <Butterfly size="lg" className="absolute bottom-10 right-20 animate-butterfly" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>
        
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <Butterfly size="md" className="mx-auto mb-6 opacity-80" />
          <h2 
            className="text-4xl md:text-5xl mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
          >
            Stay Connected
          </h2>
          <p 
            className="mb-10 leading-relaxed text-white/80"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          >
            Be the first to know about new collections, exclusive offers, and the stories 
            behind our latest creations.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-6 py-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white 
                       placeholder-white/60 text-sm rounded-full focus:outline-none focus:border-white/60
                       transition-colors"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            />
            <button
              type="submit"
              className="px-8 py-4 bg-white rounded-full text-xs uppercase tracking-[0.2em]
                       hover:scale-105 hover:shadow-xl transition-all whitespace-nowrap"
              style={{ 
                color: '#B76E79',
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 600
              }}
            >
              Subscribe ✦
            </button>
          </form>
          <p 
            className="text-xs mt-6 text-white/50"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          >
            By subscribing, you agree to our Privacy Policy.
          </p>
        </div>
      </section>
    </div>
  )
}

// Value Item Component - Dreamy Style
const ValueItem = ({ icon, text, color = '#B76E79' }) => (
  <div 
    className="py-8 px-4 text-center transition-all duration-300 hover:bg-rose-50/50 group"
    style={{ borderRight: '1px solid #F8E8E8' }}
  >
    <div 
      className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full
                transition-all duration-300 group-hover:scale-110"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {icon}
    </div>
    <p 
      className="text-xs uppercase tracking-[0.15em]"
      style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}
    >
      {text}
    </p>
  </div>
)

// Collection Card Component - Dreamy Style
const CollectionCard = ({ category, index }) => {
  const images = [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80',
  ]
  
  return (
    <Link 
      to={`/shop?category=${category.id}`}
      className="group relative aspect-[4/5] overflow-hidden rounded-2xl"
    >
      <img
        src={category.image || images[index % 3]}
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div 
        className="absolute inset-0 transition-all duration-500"
        style={{ background: 'linear-gradient(to top, rgba(183,110,121,0.5) 0%, rgba(183,110,121,0.1) 50%, transparent 100%)' }}
      />
      
<div className="absolute inset-0 flex flex-col items-center justify-end pb-8 text-white">
        <h3 
          className="text-2xl md:text-3xl mb-2"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
        >
          {category.name}
        </h3>
        <span 
          className="text-xs uppercase tracking-[0.2em] px-5 py-2 rounded-full
                   bg-white/20 backdrop-blur-sm
                   opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
                   transition-all duration-300"
          style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}
        >
          Explore ✦
        </span>
      </div>
    </Link>
  )
}

export default HomePage
