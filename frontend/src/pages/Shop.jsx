/**
 * Shop Page - Minimal handmade aesthetic
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { LoadingGrid } from '../components/LoadingSpinner';
import { ErrorMessage, EmptyState } from '../components/ErrorMessage';
import { useDebounce } from '../hooks/useApi';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    ordering: searchParams.get('ordering') || '-created_at',
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsAPI.getAll({
        ...filters,
        search: debouncedSearch,
      });
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
  }, [debouncedSearch, filters.min_price, filters.max_price, filters.ordering]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      min_price: '',
      max_price: '',
      ordering: '-created_at',
    });
    setSearchParams({});
  };

  const hasActiveFilters = filters.search || filters.min_price || filters.max_price;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8 md:py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 
            className="text-4xl md:text-5xl font-light text-neutral-900 mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Shop All
          </h1>
          <p className="text-neutral-600 text-sm md:text-base font-light">
            Explore our complete collection of handcrafted pieces
          </p>
        </div>

        {/* Filter Toggle (Mobile) */}
        <div className="lg:hidden mb-6 flex justify-between items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline inline-flex items-center"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 w-2 h-2 bg-neutral-900 rounded-full"></span>
            )}
          </button>
          
          <select
            value={filters.ordering}
            onChange={(e) => handleFilterChange('ordering', e.target.value)}
            className="input w-auto text-sm py-2"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
            <option value="-name">Name: Z to A</option>
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div 
            className={`
              ${showFilters ? 'block' : 'hidden'} lg:block
              w-full lg:w-64 flex-shrink-0
            `}
          >
            <div className="bg-white rounded-sm border border-neutral-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs uppercase tracking-widest font-medium text-neutral-900">
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="label">Search</label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="label">Price Range (Rs.)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="input text-sm"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                  />
                  <span className="text-neutral-400 self-center">—</span>
                  <input
                    type="number"
                    className="input text-sm"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  />
                </div>
              </div>

              {/* Sort (Desktop) */}
              <div className="hidden lg:block mb-6">
                <label className="label">Sort By</label>
                <select
                  value={filters.ordering}
                  onChange={(e) => handleFilterChange('ordering', e.target.value)}
                  className="input text-sm"
                >
                  <option value="-created_at">Newest First</option>
                  <option value="created_at">Oldest First</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                  <option value="-name">Name: Z to A</option>
                </select>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="label mb-3">Quick Filters</label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, max_price: '2000' });
                    }}
                    className="w-full text-left text-sm text-neutral-700 hover:text-neutral-900 
                             py-2 px-3 rounded-sm hover:bg-neutral-50 transition"
                  >
                    Under Rs. 2,000
                  </button>
                  <button
                    onClick={() => {
                      setFilters({ ...filters, min_price: '2000', max_price: '5000' });
                    }}
                    className="w-full text-left text-sm text-neutral-700 hover:text-neutral-900 
                             py-2 px-3 rounded-sm hover:bg-neutral-50 transition"
                  >
                    Rs. 2,000 - 5,000
                  </button>
                  <button
                    onClick={() => {
                      setFilters({ ...filters, min_price: '5000' });
                    }}
                    className="w-full text-left text-sm text-neutral-700 hover:text-neutral-900 
                             py-2 px-3 rounded-sm hover:bg-neutral-50 transition"
                  >
                    Over Rs. 5,000
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Count */}
            {!loading && !error && (
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-neutral-600">
                  {products.length} {products.length === 1 ? 'product' : 'products'} found
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <ErrorMessage message={error} onRetry={fetchProducts} />
            )}

            {/* Loading */}
            {loading && <LoadingGrid count={8} />}

            {/* Products */}
            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <EmptyState
                title="No products found"
                message={hasActiveFilters ? "Try adjusting your filters" : "Check back soon for new items"}
                action={
                  hasActiveFilters && (
                    <button onClick={clearFilters} className="btn-primary mt-4">
                      Clear Filters
                    </button>
                  )
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;

