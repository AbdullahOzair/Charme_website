import { Link } from 'react-router-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'

const MobileMenu = () => {
  const { closeMobileMenu } = useUIStore()
  const { isAuthenticated, user, logout } = useAuthStore()

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop All', path: '/products' },
    { name: 'New Arrivals', path: '/products?sort=newest' },
    { name: 'Best Sellers', path: '/products?sort=bestsellers' },
    { name: 'Sale', path: '/products?sale=true' },
  ]

  const accountLinks = isAuthenticated
    ? [
        { name: 'My Profile', path: '/profile' },
        { name: 'My Orders', path: '/orders' },
        { name: 'Wishlist', path: '/wishlist' },
      ]
    : [
        { name: 'Login', path: '/login' },
        { name: 'Register', path: '/register' },
      ]

  const handleLogout = async () => {
    await logout()
    closeMobileMenu()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeMobileMenu}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/" onClick={closeMobileMenu}>
            <h2 className="text-xl font-display font-semibold text-primary-600">
              Charmé
            </h2>
          </Link>
          <button 
            onClick={closeMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* User Greeting */}
        {isAuthenticated && user && (
          <div className="p-4 bg-secondary-50 border-b">
            <p className="text-sm text-gray-600">Welcome back,</p>
            <p className="font-semibold text-gray-900">
              {user.first_name || user.email}
            </p>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Shop
          </h3>
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  onClick={closeMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Account Links */}
        <nav className="p-4 border-t">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Account
          </h3>
          <ul className="space-y-1">
            {accountLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  onClick={closeMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
            {isAuthenticated && (
              <li>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Support Links */}
        <nav className="p-4 border-t">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Support
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                to="/contact"
                onClick={closeMobileMenu}
                className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Contact Us
              </Link>
            </li>
            <li>
              <Link
                to="/faq"
                onClick={closeMobileMenu}
                className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                FAQs
              </Link>
            </li>
            <li>
              <Link
                to="/shipping"
                onClick={closeMobileMenu}
                className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Shipping Info
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  )
}

export default MobileMenu
