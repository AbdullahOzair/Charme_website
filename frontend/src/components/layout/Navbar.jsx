/**
 * Navbar - Dreamy Fairytale Design with Butterfly Signature
 * Elegant jewelry navigation with rose gold tones and brand signature elements
 */
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Heart, Search } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { useEffect, useState } from 'react';

// ✨ BRAND SIGNATURE: Butterfly Icon Component
const ButterflyIcon = ({ className = "", style = {} }) => (
  <svg 
    viewBox="0 0 32 32" 
    fill="none" 
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Left Wing */}
    <path 
      d="M16 16C16 16 10 10 5 9C2 8.5 0.5 11 0.5 14C0.5 17 2 20 5 20C10 19.5 16 16 16 16Z" 
      fill="url(#butterfly-left)"
      stroke="#B76E79"
      strokeWidth="0.5"
    />
    {/* Right Wing */}
    <path 
      d="M16 16C16 16 22 10 27 9C30 8.5 31.5 11 31.5 14C31.5 17 30 20 27 20C22 19.5 16 16 16 16Z" 
      fill="url(#butterfly-right)"
      stroke="#B76E79"
      strokeWidth="0.5"
    />
    {/* Lower Left Wing */}
    <path 
      d="M16 16C16 16 11 18 7 21C4 23 4 26 6 27C8 28 11 27 14 24C16 21 16 16 16 16Z" 
      fill="url(#butterfly-lower-left)"
      stroke="#D4A574"
      strokeWidth="0.3"
    />
    {/* Lower Right Wing */}
    <path 
      d="M16 16C16 16 21 18 25 21C28 23 28 26 26 27C24 28 21 27 18 24C16 21 16 16 16 16Z" 
      fill="url(#butterfly-lower-right)"
      stroke="#D4A574"
      strokeWidth="0.3"
    />
    {/* Body */}
    <ellipse cx="16" cy="16" rx="1.2" ry="5" fill="#B76E79"/>
    {/* Antennae */}
    <path d="M15 11 Q14 8 12 7" stroke="#B76E79" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
    <path d="M17 11 Q18 8 20 7" stroke="#B76E79" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
    <circle cx="12" cy="7" r="0.8" fill="#D4A574"/>
    <circle cx="20" cy="7" r="0.8" fill="#D4A574"/>
    <defs>
      <linearGradient id="butterfly-left" x1="0" y1="9" x2="16" y2="20">
        <stop offset="0%" stopColor="#F7E7CE"/>
        <stop offset="50%" stopColor="#E8C4C4"/>
        <stop offset="100%" stopColor="#CE9B9B"/>
      </linearGradient>
      <linearGradient id="butterfly-right" x1="32" y1="9" x2="16" y2="20">
        <stop offset="0%" stopColor="#F7E7CE"/>
        <stop offset="50%" stopColor="#E8C4C4"/>
        <stop offset="100%" stopColor="#B76E79"/>
      </linearGradient>
      <linearGradient id="butterfly-lower-left" x1="4" y1="16" x2="16" y2="28">
        <stop offset="0%" stopColor="#D4A574"/>
        <stop offset="100%" stopColor="#CE9B9B"/>
      </linearGradient>
      <linearGradient id="butterfly-lower-right" x1="28" y1="16" x2="16" y2="28">
        <stop offset="0%" stopColor="#D4A574"/>
        <stop offset="100%" stopColor="#B76E79"/>
      </linearGradient>
    </defs>
  </svg>
);

// ✨ Sparkle Decoration Component
const SparkleDecor = ({ className = "" }) => (
  <span className={`text-amber-400 ${className}`}>✦</span>
);

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { totalItems, fetchCart } = useCartStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if current path matches the link
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/collections', label: 'Collections' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <>
      {/* ✨ Dreamy Announcement Bar with Butterflies */}
      <div 
        className="py-2.5 text-center relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 50%, #D4A574 100%)',
        }}
      >
        <div className="flex items-center justify-center gap-4">
          <ButterflyIcon className="w-5 h-5 animate-butterfly opacity-90" />
          <p className="text-white text-xs tracking-[0.2em] uppercase"
             style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}>
            ✨ Free Shipping on Orders Over Rs. 5,000 ✨
          </p>
          <ButterflyIcon 
            className="w-5 h-5 animate-butterfly opacity-90" 
            style={{ animationDelay: '0.5s', transform: 'scaleX(-1)' }} 
          />
        </div>
      </div>

      {/* Main Navigation */}
      <nav 
        className={`sticky top-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'py-3' 
            : 'py-5'
        }`}
        style={{ 
          backgroundColor: isScrolled ? 'rgba(255, 254, 249, 0.98)' : '#FFFEF9',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          boxShadow: isScrolled ? '0 4px 30px rgba(183, 110, 121, 0.08)' : 'none',
        }}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between">
            
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2.5 rounded-full transition-all duration-300 hover:bg-rose-50"
              style={{ color: '#B76E79' }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Desktop Left Navigation */}
            <div className="hidden lg:flex items-center space-x-10">
              {navLinks.slice(0, 3).map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="relative py-2 text-sm tracking-wide transition-all duration-300
                           group sparkle-hover"
                  style={{ 
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 500,
                    color: isActive(link.to) ? '#B76E79' : '#5C5C5C'
                  }}
                >
                  <span className={`transition-colors duration-300 ${isActive(link.to) ? 'text-rose-600' : 'group-hover:text-rose-600'}`}>{link.label}</span>
                  <span 
                    className={`absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300
                             ${isActive(link.to) ? 'w-full' : 'w-0 group-hover:w-full'}`}
                    style={{ background: 'linear-gradient(90deg, #B76E79, #D4A574)' }}
                  />
                </Link>
              ))}
            </div>

            {/* ✨ Center Logo with Butterfly Signature and Special Z */}
            <Link to="/" className="flex flex-col items-center group relative">
              {/* Floating Butterfly - Brand Signature */}
              <ButterflyIcon 
                className="absolute -top-1 -right-8 w-7 h-7 animate-butterfly opacity-90
                         group-hover:scale-110 transition-transform duration-500" 
              />
              
              {/* Sparkle decorations on hover */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <SparkleDecor className="absolute -top-2 left-1/4 text-xs animate-pulse" />
                <SparkleDecor className="absolute top-1/2 -right-3 text-[10px] animate-pulse" style={{ animationDelay: '0.2s' }} />
                <SparkleDecor className="absolute -bottom-1 left-1/3 text-[8px] animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              
              {/* Logo Text with Special Z */}
              <h1 
                className="text-2xl md:text-3xl transition-all duration-300 group-hover:scale-105 flex items-baseline"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
              >
                <span style={{ 
                  background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  FlairCharm
                </span>
                {/* ✨ Special Z - User's Initial - with gold gradient and italic */}
                <span 
                  className="relative inline-block"
                  style={{ 
                    fontStyle: 'italic',
                    fontWeight: 600,
                    fontSize: '1.1em',
                    background: 'linear-gradient(135deg, #D4A574 0%, #B76E79 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  z
                  {/* Tiny sparkle on Z */}
                  <span 
                    className="absolute -top-1 -right-1 text-[8px] animate-pulse"
                    style={{ color: '#D4A574' }}
                  >
                    ✦
                  </span>
                </span>
              </h1>
              
              {/* Tagline with sparkles */}
              <span 
                className="text-[10px] tracking-[0.3em] uppercase mt-0.5 flex items-center gap-1.5"
                style={{ 
                  fontFamily: "'Quicksand', sans-serif",
                  color: '#CE9B9B',
                  fontWeight: 500
                }}
              >
                <span className="text-[7px]" style={{ color: '#D4A574' }}>✦</span>
                Handmade Jewelry
                <span className="text-[7px]" style={{ color: '#D4A574' }}>✦</span>
              </span>
            </Link>

            {/* Desktop Right Navigation */}
            <div className="hidden lg:flex items-center space-x-10">
              {navLinks.slice(3).map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="relative py-2 text-sm tracking-wide transition-all duration-300
                           group sparkle-hover"
                  style={{ 
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 500,
                    color: isActive(link.to) ? '#B76E79' : '#5C5C5C'
                  }}
                >
                  <span className={`transition-colors duration-300 ${isActive(link.to) ? 'text-rose-600' : 'group-hover:text-rose-600'}`}>{link.label}</span>
                  <span 
                    className={`absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300
                             ${isActive(link.to) ? 'w-full' : 'w-0 group-hover:w-full'}`}
                    style={{ background: 'linear-gradient(90deg, #B76E79, #D4A574)' }}
                  />
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <button 
                className="hidden md:flex p-2.5 rounded-full transition-all duration-300
                         hover:bg-gradient-to-r hover:from-rose-50 hover:to-amber-50
                         group"
                style={{ color: '#B76E79' }}
              >
                <Search className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </button>

              {/* Wishlist */}
              <button 
                className="hidden md:flex p-2.5 rounded-full transition-all duration-300
                         hover:bg-gradient-to-r hover:from-rose-50 hover:to-amber-50
                         group relative"
                style={{ color: '#B76E79' }}
              >
                <Heart className="w-5 h-5 group-hover:scale-110 group-hover:fill-rose-100 transition-all duration-300" />
              </button>

              {/* User Menu */}
              <div className="relative group">
                <button 
                  className="p-2.5 rounded-full transition-all duration-300 
                           hover:bg-gradient-to-r hover:from-rose-50 hover:to-amber-50"
                  style={{ color: '#B76E79' }}
                >
                  <User className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                </button>

                {/* Dropdown */}
                <div 
                  className="absolute right-0 mt-2 w-60 rounded-2xl overflow-hidden
                           opacity-0 invisible translate-y-2
                           group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                           transition-all duration-300 z-50"
                  style={{ 
                    backgroundColor: '#FFFEF9',
                    boxShadow: '0 20px 60px rgba(183, 110, 121, 0.15)',
                    border: '1px solid #F8E8E8'
                  }}
                >
                  {isAuthenticated ? (
                    <>
                      <div 
                        className="px-5 py-4 relative overflow-hidden" 
                        style={{ 
                          borderBottom: '1px solid #F8E8E8',
                          background: 'linear-gradient(135deg, rgba(248,232,232,0.4) 0%, rgba(247,231,206,0.4) 100%)'
                        }}
                      >
                        <ButterflyIcon className="absolute top-2 right-2 w-8 h-8 opacity-20" />
                        <p className="text-xs uppercase tracking-wider mb-1" 
                           style={{ color: '#CE9B9B', fontFamily: "'Quicksand', sans-serif" }}>
                          Welcome back ✨
                        </p>
                        <p className="font-medium text-lg" 
                           style={{ color: '#2D2D2D', fontFamily: "'Playfair Display', serif" }}>
                          {user?.first_name || 'Beautiful'}
                        </p>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="block px-5 py-3 text-sm transition-all duration-300 hover:bg-rose-50 hover:pl-7"
                          style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif" }}
                        >
                          My Account
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-5 py-3 text-sm transition-all duration-300 hover:bg-rose-50 hover:pl-7"
                          style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif" }}
                        >
                          My Orders
                        </Link>
                        <Link
                          to="/saved-designs"
                          className="block px-5 py-3 text-sm transition-all duration-300 hover:bg-rose-50 hover:pl-7"
                          style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif" }}
                        >
                          My Designs ✨
                        </Link>
                        <Link
                          to="/wishlist"
                          className="block px-5 py-3 text-sm transition-all duration-300 hover:bg-rose-50 hover:pl-7"
                          style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif" }}
                        >
                          Wishlist 💕
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-5 py-3 text-sm transition-all duration-300 hover:bg-rose-50 hover:pl-7"
                          style={{ color: '#B76E79', fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}
                        >
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-5 space-y-3">
                      <div className="text-center mb-4">
                        <ButterflyIcon className="w-10 h-10 mx-auto mb-2 animate-butterfly" />
                        <p 
                          className="text-sm"
                          style={{ color: '#5C5C5C', fontFamily: "'Lora', serif", fontStyle: 'italic' }}
                        >
                          Join our magical world ✨
                        </p>
                      </div>
                      <Link
                        to="/login"
                        className="block w-full py-3 text-center text-sm rounded-full transition-all duration-300
                                 hover:shadow-lg hover:scale-105"
                        style={{ 
                          background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 100%)',
                          color: 'white',
                          fontFamily: "'Quicksand', sans-serif",
                          fontWeight: 600
                        }}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="block w-full py-3 text-center text-sm rounded-full transition-all duration-300
                                 border-2 hover:bg-rose-50 hover:scale-105"
                        style={{ 
                          borderColor: '#CE9B9B',
                          color: '#B76E79',
                          fontFamily: "'Quicksand', sans-serif",
                          fontWeight: 600
                        }}
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart with enhanced styling */}
              <Link 
                to="/cart" 
                className="relative p-2.5 rounded-full transition-all duration-300 
                         hover:bg-gradient-to-r hover:from-rose-50 hover:to-amber-50 group"
                style={{ color: '#B76E79' }}
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                {totalItems > 0 && (
                  <span 
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center
                             text-white text-[10px] font-bold rounded-full animate-pulse"
                    style={{ 
                      background: 'linear-gradient(135deg, #B76E79 0%, #D4A574 100%)',
                      fontFamily: "'Quicksand', sans-serif",
                      boxShadow: '0 2px 8px rgba(183, 110, 121, 0.4)'
                    }}
                  >
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

{/* Mobile Menu with Butterfly */}
        <div 
          className={`lg:hidden fixed inset-x-0 top-[104px] bottom-0 z-40 transition-all duration-500 ${
            isMobileMenuOpen 
              ? 'opacity-100 visible' 
              : 'opacity-0 invisible pointer-events-none'
          }`}
          style={{ backgroundColor: '#FFFEF9' }}
        >
          <div className="container-custom py-8 h-full overflow-y-auto">
            {/* Decorative Butterfly */}
            <div className="flex justify-center mb-8">
              <ButterflyIcon className="w-14 h-14 animate-butterfly" />
            </div>
            
            <div className="space-y-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-4 text-xl transition-all duration-300 hover:pl-4 ${isActive(link.to) ? 'pl-4 text-rose-600' : 'hover:text-rose-600'}`}
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: isActive(link.to) ? '#B76E79' : '#2D2D2D',
                    borderBottom: '1px solid #F8E8E8',
                    borderLeft: isActive(link.to) ? '3px solid #B76E79' : 'none',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className="mt-10 space-y-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 text-sm uppercase tracking-widest hover:text-rose-600 transition-colors"
                    style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif" }}
                  >
                    My Account
                  </Link>
                  <Link
                    to="/saved-designs"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 text-sm uppercase tracking-widest hover:text-rose-600 transition-colors"
                    style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif" }}
                  >
                    My Designs ✨
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 text-sm uppercase tracking-widest hover:text-rose-600 transition-colors"
                    style={{ color: '#5C5C5C', fontFamily: "'Quicksand', sans-serif" }}
                  >
                    Wishlist 💕
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block py-3 text-sm uppercase tracking-widest"
                    style={{ color: '#B76E79', fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full py-4 text-center rounded-full text-white transition-all duration-300 hover:shadow-lg"
                    style={{ 
                      background: 'linear-gradient(135deg, #B76E79 0%, #CE9B9B 100%)',
                      fontFamily: "'Quicksand', sans-serif",
                      fontWeight: 600
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full py-4 text-center rounded-full border-2 transition-all duration-300 hover:bg-rose-50"
                    style={{ 
                      borderColor: '#CE9B9B',
                      color: '#B76E79',
                      fontFamily: "'Quicksand', sans-serif",
                      fontWeight: 600
                    }}
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;

