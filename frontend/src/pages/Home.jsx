/**
 * Home Page - Dreamy Fairytale Design with Butterfly Signatures + AI Configurator
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Gem, Wand2 } from 'lucide-react';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { LoadingGrid } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

// ✨ Detailed Butterfly Component for Brand Signature
const Butterfly = ({ className = "", style = {}, size = "md" }) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    xxl: "w-32 h-32"
  };

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={`${sizes[size]} ${className}`}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 16C16 16 10 10 5 9C2 8.5 0.5 11 0.5 14C0.5 17 2 20 5 20C10 19.5 16 16 16 16Z"
            fill="url(#bf-left)" stroke="#B76E79" strokeWidth="0.5"/>
      <path d="M16 16C16 16 22 10 27 9C30 8.5 31.5 11 31.5 14C31.5 17 30 20 27 20C22 19.5 16 16 16 16Z"
            fill="url(#bf-right)" stroke="#B76E79" strokeWidth="0.5"/>
      <path d="M16 16C16 16 11 18 7 21C4 23 4 26 6 27C8 28 11 27 14 24C16 21 16 16 16 16Z"
            fill="url(#bf-ll)" stroke="#D4A574" strokeWidth="0.3"/>
      <path d="M16 16C16 16 21 18 25 21C28 23 28 26 26 27C24 28 21 27 18 24C16 21 16 16 16 16Z"
            fill="url(#bf-lr)" stroke="#D4A574" strokeWidth="0.3"/>
      <ellipse cx="16" cy="16" rx="1.2" ry="5" fill="#B76E79"/>
      <path d="M15 11 Q14 8 12 7" stroke="#B76E79" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
      <path d="M17 11 Q18 8 20 7" stroke="#B76E79" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="0.8" fill="#D4A574"/>
      <circle cx="20" cy="7" r="0.8" fill="#D4A574"/>
      <defs>
        <linearGradient id="bf-left" x1="0" y1="9" x2="16" y2="20">
          <stop offset="0%" stopColor="#F7E7CE"/><stop offset="50%" stopColor="#E8C4C4"/><stop offset="100%" stopColor="#CE9B9B"/>
        </linearGradient>
        <linearGradient id="bf-right" x1="32" y1="9" x2="16" y2="20">
          <stop offset="0%" stopColor="#F7E7CE"/><stop offset="50%" stopColor="#E8C4C4"/><stop offset="100%" stopColor="#B76E79"/>
        </linearGradient>
        <linearGradient id="bf-ll" x1="4" y1="16" x2="16" y2="28">
          <stop offset="0%" stopColor="#D4A574"/><stop offset="100%" stopColor="#CE9B9B"/>
        </linearGradient>
        <linearGradient id="bf-lr" x1="28" y1="16" x2="16" y2="28">
          <stop offset="0%" stopColor="#D4A574"/><stop offset="100%" stopColor="#B76E79"/>
        </linearGradient>
      </defs>
    </svg>
  );
};

// ✨ Sparkle Component
const GlitterSparkle = ({ style = {}, delay = 0 }) => (
  <span
    className="absolute pointer-events-none animate-pulse"
    style={{
      animationDelay: `${delay}s`,
      color: '#D4A574',
      textShadow: '0 0 10px rgba(212, 165, 116, 0.8), 0 0 20px rgba(212, 165, 116, 0.4)',
      fontSize: '14px',
      ...style
    }}
  >
    ✦
  </span>
);

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exploreHovered, setExploreHovered] = useState(false);
  const [aiHovered,      setAiHovered]      = useState(false);
  const [storyHovered,   setStoryHovered]   = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.getAll({ limit: 12 });
      setProducts(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFEF9' }}>

      {/* ✨ Hero Section */}
      <section
        className="relative py-28 md:py-36 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FFFEF9 0%, #F8E8E8 30%, #F7E7CE 70%, #E8C4C4 100%)' }}
      >
        {/* Floating Background Butterflies */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Butterfly size="xxl" className="absolute top-[5%] left-[3%] animate-butterfly" style={{ opacity: 0.15, animationDuration: '6s' }} />
          <Butterfly size="xl"  className="absolute top-[15%] right-[5%] animate-butterfly" style={{ opacity: 0.12, animationDuration: '5s', animationDelay: '1s' }} />
          <Butterfly size="lg"  className="absolute bottom-[20%] left-[10%] animate-butterfly" style={{ opacity: 0.18, animationDuration: '4.5s', animationDelay: '0.5s' }} />
          <Butterfly size="xl"  className="absolute bottom-[10%] right-[8%] animate-butterfly" style={{ opacity: 0.1, animationDuration: '5.5s', animationDelay: '2s' }} />
          <Butterfly size="lg"  className="absolute top-[40%] left-[25%] animate-butterfly" style={{ opacity: 0.08, animationDuration: '4s', animationDelay: '1.5s' }} />
          <Butterfly size="md"  className="absolute top-[60%] right-[25%] animate-butterfly" style={{ opacity: 0.15, animationDuration: '3.5s', animationDelay: '0.8s' }} />
          <GlitterSparkle style={{ top: '10%', left: '15%' }} delay={0} />
          <GlitterSparkle style={{ top: '20%', right: '20%', fontSize: '12px' }} delay={0.3} />
          <GlitterSparkle style={{ top: '35%', left: '8%', fontSize: '16px' }} delay={0.6} />
          <GlitterSparkle style={{ top: '55%', right: '12%', fontSize: '18px' }} delay={0.9} />
          <GlitterSparkle style={{ top: '70%', left: '22%', fontSize: '10px' }} delay={1.2} />
          <GlitterSparkle style={{ top: '15%', left: '55%', fontSize: '14px' }} delay={0.4} />
          <GlitterSparkle style={{ top: '45%', right: '30%', fontSize: '12px' }} delay={0.7} />
          <GlitterSparkle style={{ top: '80%', right: '35%', fontSize: '16px' }} delay={1} />
          <GlitterSparkle style={{ top: '30%', left: '35%', fontSize: '8px' }} delay={0.2} />
          <GlitterSparkle style={{ top: '65%', left: '65%', fontSize: '14px' }} delay={0.8} />
        </div>

        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <Butterfly size="lg" className="animate-butterfly" style={{ animationDuration: '3s' }} />
            </div>

            <p className="text-xs uppercase tracking-[0.4em] mb-6 flex items-center justify-center gap-3"
               style={{ color: '#B76E79', fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}>
              <span style={{ color: '#D4A574' }}>✦</span>
              Handcrafted with Love
              <span style={{ color: '#D4A574' }}>✦</span>
            </p>

            <h1 className="text-5xl md:text-7xl mb-6 tracking-tight leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
              <span style={{ background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 50%, #D4A574 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Handcrafted with
              </span>
              <span className="block mt-2" style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontWeight: 400, color: '#2D2D2D' }}>
                Care &amp; Passion
              </span>
            </h1>

            <p className="text-base md:text-lg mb-12 max-w-2xl mx-auto leading-relaxed"
               style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif", fontWeight: 400 }}>
              Discover unique, artisan-made pieces that tell a story. Each item is lovingly handcrafted
              with attention to detail and quality materials.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              {/* Explore Collection */}
              <div className="relative"
                   onMouseEnter={() => setExploreHovered(true)}
                   onMouseLeave={() => setExploreHovered(false)}>
                <Link to="/shop"
                  className="inline-flex items-center justify-center px-10 py-4 rounded-full text-xs uppercase tracking-[0.2em] text-white transition-all duration-500 hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
                  style={{ background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 100%)', fontFamily: "'Quicksand', sans-serif", fontWeight: 600, boxShadow: '0 10px 40px rgba(183, 110, 121, 0.3)' }}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Explore Collection
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                {exploreHovered && (
                  <div className="absolute inset-0 pointer-events-none overflow-visible">
                    <div className="absolute -top-8 left-1/4" style={{ animation: 'flyUp 0.8s ease-out forwards' }}>
                      <Butterfly size="sm" className="-rotate-12" style={{ opacity: 0.9 }} />
                    </div>
                    <div className="absolute -top-10 right-1/4" style={{ animation: 'flyUp 1s ease-out forwards', animationDelay: '0.1s' }}>
                      <Butterfly size="sm" className="rotate-12" style={{ opacity: 0.85 }} />
                    </div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2" style={{ animation: 'flyUp 0.9s ease-out forwards', animationDelay: '0.05s' }}>
                      <Butterfly size="sm" style={{ opacity: 0.95 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Design with AI — sparkle burst on hover */}
              <div className="relative"
                   onMouseEnter={() => setAiHovered(true)}
                   onMouseLeave={() => setAiHovered(false)}>
                <Link to="/configurator"
                  className="inline-flex items-center justify-center px-10 py-4 rounded-full text-xs uppercase tracking-[0.2em] border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
                  style={{
                    borderColor: '#B76E79',
                    color: aiHovered ? '#fff' : '#B76E79',
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 600,
                    background: aiHovered
                      ? 'linear-gradient(135deg, #B76E79 0%, #D4A574 100%)'
                      : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: aiHovered ? '0 10px 40px rgba(212,165,116,0.45)' : 'none',
                    transition: 'all 0.4s ease',
                  }}>
                  {/* Shimmer sweep */}
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                      transform: aiHovered ? 'translateX(100%)' : 'translateX(-100%)',
                      transition: 'transform 0.6s ease',
                    }}
                  />
                  <Wand2 className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                  Design with AI
                </Link>

                {/* Gold sparkles burst on hover */}
                {aiHovered && (
                  <div className="absolute inset-0 pointer-events-none overflow-visible">
                    {/* Top-centre */}
                    <span className="absolute left-1/2 -translate-x-1/2" style={{ top: '-2px', fontSize: '18px', color: '#D4A574', textShadow: '0 0 12px rgba(212,165,116,0.9)', animation: 'sparkleUp 0.7s ease-out forwards' }}>✦</span>
                    {/* Top-left */}
                    <span className="absolute" style={{ top: '10%', left: '15%', fontSize: '14px', color: '#CE9B9B', textShadow: '0 0 10px rgba(206,155,155,0.9)', animation: 'sparkleUpLeft 0.8s ease-out forwards', animationDelay: '0.05s' }}>✦</span>
                    {/* Top-right */}
                    <span className="absolute" style={{ top: '10%', right: '15%', fontSize: '14px', color: '#D4A574', textShadow: '0 0 10px rgba(212,165,116,0.9)', animation: 'sparkleUpRight 0.8s ease-out forwards', animationDelay: '0.08s' }}>✦</span>
                    {/* Far left */}
                    <span className="absolute" style={{ top: '40%', left: '-8px', fontSize: '12px', color: '#B76E79', textShadow: '0 0 8px rgba(183,110,121,0.9)', animation: 'sparkleLeft 0.75s ease-out forwards', animationDelay: '0.1s' }}>✦</span>
                    {/* Far right */}
                    <span className="absolute" style={{ top: '40%', right: '-8px', fontSize: '12px', color: '#B76E79', textShadow: '0 0 8px rgba(183,110,121,0.9)', animation: 'sparkleRight 0.75s ease-out forwards', animationDelay: '0.1s' }}>✦</span>
                    {/* Bottom-left */}
                    <span className="absolute" style={{ bottom: '0', left: '25%', fontSize: '10px', color: '#D4A574', textShadow: '0 0 8px rgba(212,165,116,0.9)', animation: 'sparkleDownLeft 0.9s ease-out forwards', animationDelay: '0.12s' }}>✦</span>
                    {/* Bottom-right */}
                    <span className="absolute" style={{ bottom: '0', right: '25%', fontSize: '10px', color: '#CE9B9B', textShadow: '0 0 8px rgba(206,155,155,0.9)', animation: 'sparkleDownRight 0.9s ease-out forwards', animationDelay: '0.12s' }}>✦</span>
                    {/* Tiny extra centre */}
                    <span className="absolute left-1/2 -translate-x-1/2" style={{ top: '-16px', fontSize: '10px', color: '#fff', textShadow: '0 0 10px rgba(212,165,116,1)', animation: 'sparkleUp 0.6s ease-out forwards', animationDelay: '0.15s' }}>✦</span>
                  </div>
                )}
              </div>

              {/* Our Story */}
              <div className="relative"
                   onMouseEnter={() => setStoryHovered(true)}
                   onMouseLeave={() => setStoryHovered(false)}>
                <Link to="/about"
                  className="inline-flex items-center justify-center px-10 py-4 rounded-full text-xs uppercase tracking-[0.2em] transition-all duration-500 hover:scale-105"
                  style={{ color: '#B76E79', fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}>
                  Our Story
                </Link>
                <div className={`absolute -top-8 right-0 transition-all duration-700 ease-out ${storyHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 -rotate-45'}`}>
                  <Butterfly size="md" className="drop-shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #CE9B9B, transparent)' }} />
      </section>

      {/* ✨ AI Configurator Feature Banner */}
      <section style={{ background: 'linear-gradient(135deg, #3D1A24 0%, #5C2D3A 50%, #7A3D4A 100%)' }} className="py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest mb-4" style={{ color: '#D4A574' }}>
                <Sparkles className="w-4 h-4" />
                AI-Powered
              </div>
              <h2 className="text-4xl md:text-5xl font-light mb-4 leading-tight text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                Design Your Own
                <span className="block" style={{ fontStyle: 'italic', color: '#E8C4C4' }}>Custom Bracelet</span>
              </h2>
              <p className="leading-relaxed mb-8 text-sm" style={{ color: '#D4A574', fontFamily: "'Quicksand', sans-serif" }}>
                Describe your dream bracelet in plain words and watch our AI bring it to life in a
                real-time 3D viewer. Choose beads, chains, and charms — then order your one-of-a-kind piece.
              </p>
              <Link to="/configurator"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs uppercase tracking-widest font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg, #D4A574 0%, #CE9B9B 100%)', color: '#3D1A24', fontFamily: "'Quicksand', sans-serif" }}>
                <Wand2 className="w-4 h-4" />
                Start Designing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Sparkles, label: 'AI Prompt',    desc: 'Describe your style in words' },
                { icon: Gem,      label: '3D Preview',   desc: 'See your design in real time' },
                { icon: Wand2,    label: 'Custom Order', desc: 'Handcrafted just for you' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,165,116,0.2)' }}>
                  <Icon className="w-6 h-6 mx-auto mb-3" style={{ color: '#D4A574' }} />
                  <p className="text-sm font-medium text-white mb-1" style={{ fontFamily: "'Quicksand', sans-serif" }}>{label}</p>
                  <p className="text-xs leading-snug" style={{ color: '#CE9B9B', fontFamily: "'Quicksand', sans-serif" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="container-custom py-8">
          <ErrorMessage message={error} onRetry={fetchProducts} />
        </div>
      )}

      {/* Featured Products */}
      <section className="py-20" style={{ backgroundColor: '#FFFEF9' }}>
        <div className="container-custom">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2"
               style={{ color: '#CE9B9B', fontFamily: "'Quicksand', sans-serif" }}>
              <span style={{ color: '#D4A574' }}>✦</span>
              Our Collection
              <span style={{ color: '#D4A574' }}>✦</span>
            </p>
            <h2 className="text-4xl md:text-5xl mb-4"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: '#2D2D2D' }}>
              Featured Pieces
            </h2>
            <p className="text-sm md:text-base max-w-lg mx-auto"
               style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif" }}>
              Carefully selected pieces that showcase our finest craftsmanship
            </p>
          </div>

          {loading ? (
            <LoadingGrid count={8} />
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link to="/shop"
                  className="inline-flex items-center px-8 py-3 rounded-full border-2 transition-all duration-300 hover:scale-105 group"
                  style={{ borderColor: '#B76E79', color: '#B76E79', fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  View All Products
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </>
          ) : (
            !error && (
              <div className="text-center py-12">
                <Butterfly size="lg" className="mx-auto mb-4 opacity-30" />
                <p style={{ color: '#CE9B9B', fontFamily: "'Quicksand', sans-serif" }}>No products available yet</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20" style={{ backgroundColor: '#F8E8E8' }}>
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Butterfly size="sm" />
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#CE9B9B', fontFamily: "'Quicksand', sans-serif" }}>
                  About Us
                </p>
              </div>
              <h2 className="text-4xl md:text-5xl mb-6"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: '#2D2D2D' }}>
                Crafted with Heart
              </h2>
              <div className="space-y-4 leading-relaxed" style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif" }}>
                <p>
                  Every piece in our collection is thoughtfully designed and meticulously handcrafted
                  by skilled artisans who pour their heart into their work.
                </p>
                <p>
                  We believe in slow fashion, sustainable practices, and creating items that are
                  meant to be treasured for years to come.
                </p>
              </div>
              <Link to="/about"
                className="mt-8 inline-flex items-center px-8 py-3 rounded-full text-white transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                style={{ background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 100%)', fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Learn More About Us
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden relative" style={{ backgroundColor: '#E8C4C4' }}>
              <div className="w-full h-full flex items-center justify-center relative">
                <Butterfly size="xxl" className="opacity-20 animate-butterfly" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm uppercase tracking-widest" style={{ color: '#B76E79', fontFamily: "'Quicksand', sans-serif" }}>
                    Artisan Image
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 50%, #D4A574 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <Butterfly size="xl" className="absolute top-10 left-10 animate-butterfly" style={{ opacity: 0.15 }} />
          <Butterfly size="lg" className="absolute bottom-10 right-20 animate-butterfly" style={{ opacity: 0.12, animationDelay: '1s' }} />
        </div>
        <div className="container-custom text-center relative z-10">
          <Butterfly size="md" className="mx-auto mb-6" style={{ opacity: 0.8 }} />
          <h2 className="text-4xl md:text-5xl mb-6 text-white"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
            Stay Connected
          </h2>
          <p className="mb-8 max-w-2xl mx-auto text-white/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            Subscribe to our newsletter for exclusive offers, new arrivals, and behind-the-scenes stories.
          </p>
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white placeholder-white/60 focus:outline-none focus:border-white/60 transition"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            />
            <button type="submit"
              className="px-8 py-4 bg-white rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ color: '#B76E79', fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}>
              Subscribe ✦
            </button>
          </form>
        </div>
      </section>

      {/* Butterfly animation keyframes */}
      <style>{`
        @keyframes flyUp {
          0%   { transform: translateY(0) scale(0.5); opacity: 0; }
          50%  { opacity: 1; }
          100% { transform: translateY(-40px) scale(1); opacity: 0.9; }
        }
        @keyframes flyUpLeft {
          0%   { transform: translate(0,0) scale(0.5) rotate(0deg); opacity: 0; }
          50%  { opacity: 1; }
          100% { transform: translate(-30px,-35px) scale(1) rotate(-15deg); opacity: 0.8; }
        }
        @keyframes flyUpRight {
          0%   { transform: translate(0,0) scale(0.5) rotate(0deg); opacity: 0; }
          50%  { opacity: 1; }
          100% { transform: translate(30px,-35px) scale(1) rotate(15deg); opacity: 0.85; }
        }

        /* ✦ AI button sparkle burst */
        @keyframes sparkleUp {
          0%   { transform: translateX(-50%) translateY(0)  scale(0.3); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translateX(-50%) translateY(-38px) scale(1.2); opacity: 0; }
        }
        @keyframes sparkleUpLeft {
          0%   { transform: translate(0,0)    scale(0.3) rotate(0deg);   opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translate(-28px,-30px) scale(1.1) rotate(-20deg); opacity: 0; }
        }
        @keyframes sparkleUpRight {
          0%   { transform: translate(0,0)    scale(0.3) rotate(0deg);   opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translate(28px,-30px)  scale(1.1) rotate(20deg);  opacity: 0; }
        }
        @keyframes sparkleLeft {
          0%   { transform: translate(0,0) scale(0.3); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translate(-32px,-8px) scale(1); opacity: 0; }
        }
        @keyframes sparkleRight {
          0%   { transform: translate(0,0) scale(0.3); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translate(32px,-8px) scale(1); opacity: 0; }
        }
        @keyframes sparkleDownLeft {
          0%   { transform: translate(0,0) scale(0.3) rotate(0deg);    opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translate(-20px,22px) scale(0.9) rotate(-10deg); opacity: 0; }
        }
        @keyframes sparkleDownRight {
          0%   { transform: translate(0,0) scale(0.3) rotate(0deg);   opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translate(20px,22px) scale(0.9) rotate(10deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Home;
