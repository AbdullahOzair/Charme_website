import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { productService } from '../../services/productService'

const ProductFilter = ({ onFilterChange, isMobile = false, onClose }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('min_price') || '',
    max: searchParams.get('max_price') || '',
  })

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || '',
    in_stock: searchParams.get('in_stock') === 'true',
    on_sale: searchParams.get('on_sale') === 'true',
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productService.getCategories()
        setCategories(data.results || data)
      } catch {
        console.error('Failed to fetch categories')
      }
    }
    fetchCategories()
  }, [])

  const sortOptions = [
    { value: '', label: 'Featured' },
    { value: '-created_at', label: 'Newest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-average_rating', label: 'Top Rated' },
    { value: '-total_sales', label: 'Best Selling' },
  ]

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateSearchParams(newFilters, priceRange)
  }

  const handlePriceChange = (key, value) => {
    const newPriceRange = { ...priceRange, [key]: value }
    setPriceRange(newPriceRange)
  }

  const applyPriceFilter = () => {
    updateSearchParams(filters, priceRange)
  }

  const updateSearchParams = (filterState, priceState) => {
    const params = new URLSearchParams()
    
    if (filterState.category) params.set('category', filterState.category)
    if (filterState.sort) params.set('sort', filterState.sort)
    if (filterState.in_stock) params.set('in_stock', 'true')
    if (filterState.on_sale) params.set('on_sale', 'true')
    if (priceState.min) params.set('min_price', priceState.min)
    if (priceState.max) params.set('max_price', priceState.max)

    setSearchParams(params)
    
    if (onFilterChange) {
      onFilterChange({
        ...filterState,
        min_price: priceState.min,
        max_price: priceState.max,
      })
    }
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      sort: '',
      in_stock: false,
      on_sale: false,
    })
    setPriceRange({ min: '', max: '' })
    setSearchParams({})
    if (onFilterChange) {
      onFilterChange({})
    }
  }

  const hasActiveFilters = 
    filters.category || 
    filters.sort || 
    filters.in_stock || 
    filters.on_sale || 
    priceRange.min || 
    priceRange.max

  const content = (
    <div className="space-y-6">
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button onClick={onClose} className="p-2">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Sort By */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="input"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              checked={!filters.category}
              onChange={() => handleFilterChange('category', '')}
              className="text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">All Categories</span>
          </label>
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={category.slug}
                checked={filters.category === category.slug}
                onChange={() => handleFilterChange('category', category.slug)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">{category.name}</span>
              {category.product_count !== undefined && (
                <span className="text-gray-400 text-sm">({category.product_count})</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => handlePriceChange('min', e.target.value)}
            className="input w-24"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => handlePriceChange('max', e.target.value)}
            className="input w-24"
          />
          <button
            onClick={applyPriceFilter}
            className="btn-primary py-2 px-4"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Availability</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.in_stock}
            onChange={(e) => handleFilterChange('in_stock', e.target.checked)}
            className="rounded text-primary-600 focus:ring-primary-500"
          />
          <span className="text-gray-700">In Stock Only</span>
        </label>
      </div>

      {/* On Sale */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Offers</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.on_sale}
            onChange={(e) => handleFilterChange('on_sale', e.target.checked)}
            className="rounded text-primary-600 focus:ring-primary-500"
          />
          <span className="text-gray-700">On Sale</span>
        </label>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full btn-outline"
        >
          Clear All Filters
        </button>
      )}

      {/* Mobile Apply Button */}
      {isMobile && (
        <button
          onClick={onClose}
          className="w-full btn-primary"
        >
          Apply Filters
        </button>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
        <div className="fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-white z-50 p-6 overflow-y-auto">
          {content}
        </div>
      </>
    )
  }

  return <div className="sticky top-24">{content}</div>
}

export default ProductFilter
