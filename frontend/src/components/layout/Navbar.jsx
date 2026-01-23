/**
 * Navbar Component - Minimal handmade aesthetic
 */
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { totalItems, fetchCart } = useCartStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Fetch cart for all users (authenticated and guest)
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
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav 
      className={`
        sticky top-0 z-50 bg-white transition-all duration-300
        ${isScrolled ? 'shadow-md' : 'border-b border-neutral-200'}
      `}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span 
              className="text-2xl md:text-3xl font-light tracking-tight text-neutral-900"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Charmé
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm uppercase tracking-widest text-neutral-700 hover:text-neutral-900 
                         transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* User Menu - Desktop */}
            <div className="hidden md:block relative group">
              <button className="p-2 text-neutral-700 hover:text-neutral-900 transition-colors">
                <User className="w-5 h-5" />
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-sm shadow-lg border border-neutral-100 
                            py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                            transition-all duration-200">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">Account</p>
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {user?.first_name || user?.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Cart */}
            <Link 
              to="/cart" 
              className="p-2 text-neutral-700 hover:text-neutral-900 transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[10px] 
                               rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-neutral-700 hover:text-neutral-900 transition"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <div className="container-custom py-6">
            {/* Navigation Links */}
            <div className="flex flex-col space-y-4 mb-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm uppercase tracking-widest text-neutral-700 hover:text-neutral-900 
                           transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* User Actions */}
            <div className="pt-6 border-t border-neutral-200">
              {isAuthenticated ? (
                <>
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">Account</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {user?.first_name || user?.email}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-3">
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm text-neutral-700"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm text-neutral-700"
                    >
                      Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-neutral-700 text-left"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-primary text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-outline text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

