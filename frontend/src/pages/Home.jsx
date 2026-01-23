/**
 * Home Page - Minimal handmade aesthetic
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { LoadingGrid } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-neutral-50 py-24 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 
              className="text-5xl md:text-7xl font-light text-neutral-900 mb-6 tracking-tight leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Handcrafted with
              <span className="block mt-2">Care & Passion</span>
            </h1>
            <p className="text-base md:text-lg text-neutral-600 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Discover unique, artisan-made pieces that tell a story. Each item is lovingly handcrafted 
              with attention to detail and quality materials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop" className="btn-primary inline-flex items-center justify-center">
                Explore Collection
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/about" className="btn-outline inline-flex items-center justify-center">
                Our Story
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="container-custom py-8">
          <ErrorMessage message={error} onRetry={fetchProducts} />
        </div>
      )}

      {/* Featured Products */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-light text-neutral-900 mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Our Collection
            </h2>
            <p className="text-neutral-600 text-sm md:text-base font-light">
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
                <Link to="/shop" className="btn-outline inline-flex items-center">
                  View All Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </>
          ) : (
            !error && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No products available</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 
                className="text-4xl md:text-5xl font-light text-neutral-900 mb-6"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Crafted with Heart
              </h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <p>
                  Every piece in our collection is thoughtfully designed and meticulously handcrafted 
                  by skilled artisans who pour their heart into their work.
                </p>
                <p>
                  We believe in slow fashion, sustainable practices, and creating items that are 
                  meant to be treasured for years to come.
                </p>
              </div>
              <Link to="/about" className="btn-primary mt-8 inline-flex items-center">
                Learn More About Us
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
            <div className="aspect-square bg-neutral-100 rounded-sm overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                {/* Placeholder for image */}
                <span className="text-sm uppercase tracking-widest">Artisan Image</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900 text-white">
        <div className="container-custom text-center">
          <h2 
            className="text-4xl md:text-5xl font-light mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Stay Connected
          </h2>
          <p className="text-neutral-300 mb-8 max-w-2xl mx-auto font-light">
            Subscribe to our newsletter for exclusive offers, new arrivals, and behind-the-scenes stories.
          </p>
          <form className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-sm 
                       text-white placeholder-neutral-400 focus:outline-none focus:ring-1 
                       focus:ring-white/50 transition"
            />
            <button type="submit" className="px-6 py-3 bg-white text-neutral-900 rounded-sm font-medium hover:bg-neutral-100 transition">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;

