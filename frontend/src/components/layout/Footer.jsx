/**
 * Footer Component - Sophisticated Luxury Design
 */
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div className="max-w-xl mx-auto text-center">
            <h3 
              className="text-3xl mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
            >
              Join Our World
            </h3>
            <p className="text-neutral-400 text-sm mb-8 font-light">
              Subscribe to receive updates on new collections, exclusive offers, and the stories behind our craft.
            </p>
            <form className="flex gap-0">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-transparent border border-neutral-700 text-white 
                         placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-500
                         transition-colors"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-white text-neutral-900 text-xs uppercase tracking-[0.2em]
                         font-light hover:bg-neutral-100 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h2 
              className="text-2xl mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
            >
              FlairCharmz
            </h2>
            <p className="text-neutral-400 text-sm font-light leading-relaxed mb-8">
              Handcrafted jewelry that celebrates individuality. Each piece tells a story of artistry and elegance.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 border border-neutral-700 flex items-center justify-center
                                   text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 border border-neutral-700 flex items-center justify-center
                                   text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 border border-neutral-700 flex items-center justify-center
                                   text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">
              Shop
            </h4>
            <ul className="space-y-4">
              {['All Collections', 'New Arrivals', 'Bestsellers', 'Gift Cards'].map((item) => (
                <li key={item}>
                  <Link 
                    to="/shop" 
                    className="text-sm text-neutral-400 hover:text-white transition-colors font-light"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">
              Customer Care
            </h4>
            <ul className="space-y-4">
              {['Contact Us', 'Shipping & Returns', 'Size Guide', 'Care Instructions', 'FAQ'].map((item) => (
                <li key={item}>
                  <Link 
                    to="/contact" 
                    className="text-sm text-neutral-400 hover:text-white transition-colors font-light"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">
              Get in Touch
            </h4>
            <ul className="space-y-4 text-sm text-neutral-400 font-light">
              <li>
                <span className="block text-[10px] uppercase tracking-widest text-neutral-600 mb-1">Email</span>
                hello@flaircharmz.com
              </li>
              <li>
                <span className="block text-[10px] uppercase tracking-widest text-neutral-600 mb-1">Phone</span>
                +92 300 1234567
              </li>
              <li>
                <span className="block text-[10px] uppercase tracking-widest text-neutral-600 mb-1">Studio</span>
                Lahore, Pakistan
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-neutral-500 font-light">
              © {currentYear} FlairCharmz. All rights reserved.
            </p>
            <div className="flex items-center space-x-8">
              <Link to="/privacy" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

