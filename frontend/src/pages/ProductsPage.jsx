import { useState, useEffect } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { FunnelIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline'
import ProductGrid from '../components/products/ProductGrid'
import ProductFilter from '../components/products/ProductFilter'
import { productService } from '../services/productService'

const ProductsPage = () => {
  const [searchParams] = useSearchParams()
  const { slug: categorySlug } = useParams()
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    totalPages: 1,
  })
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    fetchProducts()
  }, [searchParams, categorySlug])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {
        page: searchParams.get('page') || 1,
        category: categorySlug || searchParams.get('category') || '',
        search: searchParams.get('search') || '',
        ordering: searchParams.get('sort') || '',
        min_price: searchParams.get('min_price') || '',
        max_price: searchParams.get('max_price') || '',
        in_stock: searchParams.get('in_stock') || '',
        on_sale: searchParams.get('on_sale') || searchParams.get('sale') || '',
      }

      // Clean up empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })

      const data = await productService.getProducts(params)
      
      setProducts(data.results || data)
      setPagination({
        count: data.count || data.length,
        page: parseInt(params.page) || 1,
        totalPages: Math.ceil((data.count || data.length) / 12),
      })
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPageTitle = () => {
    if (searchParams.get('search')) {
      return `Search results for "${searchParams.get('search')}"`
    }
    if (searchParams.get('sale') || searchParams.get('on_sale')) {
      return 'Sale'
    }
    if (searchParams.get('sort') === '-created_at') {
      return 'New Arrivals'
    }
    if (searchParams.get('sort') === '-total_sales') {
      return 'Best Sellers'
    }
    if (categorySlug) {
      return categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, ' ')
    }
    return 'All Products'
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title">{getPageTitle()}</h1>
          <p className="text-gray-600 mt-2">
            {pagination.count} {pagination.count === 1 ? 'product' : 'products'} found
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filter */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilter onFilterChange={fetchProducts} />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowMobileFilter(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5" />
                Filters
              </button>

              {/* View Mode */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                  aria-label="Grid view"
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                  aria-label="List view"
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <ProductGrid 
              products={products} 
              loading={loading} 
              columns={viewMode === 'list' ? 2 : 3}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination 
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
              />
            )}
          </main>
        </div>

        {/* Mobile Filter Modal */}
        {showMobileFilter && (
          <ProductFilter 
            isMobile 
            onClose={() => setShowMobileFilter(false)}
            onFilterChange={fetchProducts}
          />
        )}
      </div>
    </div>
  )
}

// Pagination Component
const Pagination = ({ currentPage, totalPages }) => {
  const [searchParams, setSearchParams] = useSearchParams()

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pages = []
  const showEllipsis = totalPages > 7

  if (showEllipsis) {
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    }
  } else {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      {pages.map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2">...</span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`w-10 h-10 rounded-lg font-medium ${
              currentPage === page
                ? 'bg-primary-600 text-white'
                : 'hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  )
}

export default ProductsPage
