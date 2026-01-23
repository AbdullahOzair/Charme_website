import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useUIStore } from '../../stores/uiStore'
import { productService } from '../../services/productService'
import { useDebounce } from '../../hooks/useDebounce'

const SearchModal = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { closeSearch } = useUIStore()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const searchProducts = async () => {
      if (debouncedQuery.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const data = await productService.searchProducts(debouncedQuery, { page_size: 6 })
        setResults(data.results || data)
      } catch {
        console.error('Search failed')
      } finally {
        setIsLoading(false)
      }
    }

    searchProducts()
  }, [debouncedQuery])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query)}`)
      closeSearch()
    }
  }

  const popularSearches = [
    'Beaded bracelets',
    'Gold chain',
    'Pearl bracelet',
    'Charm bracelet',
    'Handmade',
  ]

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeSearch}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-0 top-0 bg-white z-50 shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="container-custom py-6">
          {/* Close Button */}
          <button 
            onClick={closeSearch}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close search"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for bracelets..."
                className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
              />
            </div>
          </form>

          {/* Results */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="mt-6 max-w-2xl mx-auto">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Products
              </h3>
              <div className="space-y-3">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug}`}
                    onClick={closeSearch}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <img
                      src={product.image || '/images/placeholder.jpg'}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-primary-600 font-semibold">
                        Rs. {product.price?.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              
              {query && (
                <button
                  onClick={handleSubmit}
                  className="mt-4 w-full py-3 text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors"
                >
                  View all results for "{query}"
                </button>
              )}
            </div>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No products found for "{query}"</p>
            </div>
          )}

          {/* Popular Searches */}
          {!query && (
            <div className="mt-6 max-w-2xl mx-auto">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Popular Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default SearchModal
