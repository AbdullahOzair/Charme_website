import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, SparklesIcon, TruckIcon, ShieldCheckIcon, HeartIcon } from '@heroicons/react/24/outline'
import ProductGrid from '../components/products/ProductGrid'
import { productService } from '../services/productService'

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, arrivals, sellers, cats] = await Promise.all([
          productService.getFeaturedProducts(4),
          productService.getNewArrivals(4),
          productService.getBestSellers(4),
          productService.getCategories(),
        ])
        
        setFeaturedProducts(featured.results || featured)
        setNewArrivals(arrivals.results || arrivals)
        setBestSellers(sellers.results || sellers)
        setCategories((cats.results || cats).slice(0, 4))
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary-100 via-white to-primary-50 overflow-hidden">
        <div className="container-custom py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                ✨ Handcrafted with Love
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-gray-900 leading-tight">
                Discover Your
                <span className="text-gradient block">Perfect Charm</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
                Unique handmade bracelets that tell your story. Each piece is crafted 
                with care, designed to be as special as the moments you wear them.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/products" className="btn-primary">
                  Shop Collection
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/products?sort=newest" className="btn-outline">
                  New Arrivals
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/hero-bracelet.jpg"
                  alt="Handmade bracelets collection"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <SparklesIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">500+</p>
                    <p className="text-sm text-gray-500">Happy Customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white border-y">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <FeatureCard
              icon={<TruckIcon className="h-6 w-6" />}
              title="Free Shipping"
              description="On orders over Rs. 5,000"
            />
            <FeatureCard
              icon={<ShieldCheckIcon className="h-6 w-6" />}
              title="Secure Payment"
              description="Multiple payment options"
            />
            <FeatureCard
              icon={<SparklesIcon className="h-6 w-6" />}
              title="Handcrafted"
              description="Each piece is unique"
            />
            <FeatureCard
              icon={<HeartIcon className="h-6 w-6" />}
              title="Gift Packaging"
              description="Free on all orders"
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find the perfect bracelet for every occasion</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-20 bg-secondary-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="section-title">Featured Collection</h2>
              <p className="section-subtitle">Our most loved pieces</p>
            </div>
            <Link 
              to="/products?featured=true" 
              className="hidden sm:flex items-center text-primary-600 font-medium hover:underline"
            >
              View All
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <ProductGrid products={featuredProducts} loading={loading} columns={4} />
          
          <div className="mt-8 text-center sm:hidden">
            <Link to="/products?featured=true" className="btn-outline">
              View All Featured
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="section-title">New Arrivals</h2>
              <p className="section-subtitle">Fresh designs just for you</p>
            </div>
            <Link 
              to="/products?sort=newest" 
              className="hidden sm:flex items-center text-primary-600 font-medium hover:underline"
            >
              View All
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <ProductGrid products={newArrivals} loading={loading} columns={4} />
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white to-secondary-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="section-title">Best Sellers</h2>
              <p className="section-subtitle">Customer favorites</p>
            </div>
            <Link 
              to="/products?sort=bestsellers" 
              className="hidden sm:flex items-center text-primary-600 font-medium hover:underline"
            >
              View All
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <ProductGrid products={bestSellers} loading={loading} columns={4} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="bg-primary-600 rounded-2xl px-6 py-12 md:p-16 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-semibold mb-4">
                Get 10% Off Your First Order
              </h2>
              <p className="text-primary-100 mb-8 max-w-lg mx-auto">
                Join our community and be the first to know about new collections, 
                special offers, and styling tips.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button 
                  type="submit"
                  className="px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-700 rounded-full translate-y-1/2 -translate-x-1/2 opacity-50" />
          </div>
        </div>
      </section>
    </div>
  )
}

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div className="text-center">
    <div className="w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-3">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500 mt-1">{description}</p>
  </div>
)

// Category Card Component
const CategoryCard = ({ category }) => (
  <Link 
    to={`/category/${category.slug}`}
    className="group relative aspect-square rounded-xl overflow-hidden"
  >
    <img
      src={category.image || '/images/placeholder-category.jpg'}
      alt={category.name}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 p-4">
      <h3 className="font-semibold text-white text-lg">{category.name}</h3>
      {category.product_count !== undefined && (
        <p className="text-white/80 text-sm">{category.product_count} products</p>
      )}
    </div>
  </Link>
)

export default HomePage
