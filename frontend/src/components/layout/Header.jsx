import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  ShoppingBagIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  Bars3Icon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import { useUIStore } from '../../stores/uiStore'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const { itemCount } = useCartStore()
  const { openCart, openSearch, openMobileMenu } = useUIStore()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/products' },
    { name: 'New Arrivals', path: '/products?sort=newest' },
    { name: 'Best Sellers', path: '/products?sort=bestsellers' },
    { name: 'Sale', path: '/products?sale=true' },
  ]

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm' 
          : 'bg-white'
      }`}
    >
      {/* Promo Banner */}
      <div className="bg-primary-600 text-white text-center py-2 text-sm">
        <p>✨ Free shipping on orders over Rs. 5,000 | Use code WELCOME10 for 10% off</p>
      </div>

      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 -ml-2"
            onClick={openMobileMenu}
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-primary-600">
              FlairCharmz
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Search */}
            <button 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={openSearch}
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link 
                to="/wishlist"
                className="hidden sm:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Wishlist"
              >
                <HeartIcon className="h-5 w-5 md:h-6 md:w-6" />
              </Link>
            )}

            {/* User */}
            <Link 
              to={isAuthenticated ? '/profile' : '/login'}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={isAuthenticated ? 'Profile' : 'Login'}
            >
              {isAuthenticated && user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.first_name} 
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-5 w-5 md:h-6 md:w-6" />
              )}
            </Link>

            {/* Cart */}
            <button 
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={openCart}
              aria-label="Cart"
            >
              <ShoppingBagIcon className="h-5 w-5 md:h-6 md:w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
