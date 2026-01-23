/**
 * Product Detail Page
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { productService } from '../services/api';
import useCartStore from '../stores/cartStore';
import { ShoppingBagIcon, HeartIcon } from '@heroicons/react/24/outline';
import ProductCard from '../components/ProductCard';
import ProductImageGallery from '../components/ProductImageGallery';

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await productService.getBySlug(slug);
        setProduct(response.data);
        
        // Fetch related products
        if (response.data.category?.id) {
          const relatedRes = await productService.getAll({ category: response.data.category.id });
          setRelatedProducts((relatedRes.data.results || []).filter(p => p.id !== response.data.id).slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    await addItem(product.id, quantity);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="animate-shimmer h-96 rounded-xl"></div>
            <div className="animate-shimmer h-96 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom text-center">
          <h1 className="text-3xl font-display font-bold">Product not found</h1>
        </div>
      </div>
    );
  }

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div>
            <ProductImageGallery
              mainImage={product.image}
              images={product.images || []}
              productName={product.name}
            />
          </div>

          {/* Info */}
          <div>
            <div className="flex gap-2 mb-4">
              {product.is_new_arrival && <span className="badge-new">New</span>}
              {product.is_on_sale && product.discount_percent > 0 && (
                <span className="badge-sale">-{Math.round(product.discount_percent)}% OFF</span>
              )}
              {product.is_bestseller && <span className="badge-bestseller">Bestseller</span>}
            </div>

            <h1 className="text-4xl font-display font-bold mb-4">{product.name}</h1>

            <div className="flex items-baseline gap-3 mb-6">
              {product.is_on_sale && product.sale_price ? (
                <>
                  <span className="text-3xl font-semibold text-red-600">
                    Rs. {Number(product.sale_price).toLocaleString()}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    Rs. {Number(product.price).toLocaleString()}
                  </span>
                  <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                    Save Rs. {Number(product.savings).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-semibold text-primary-600">
                  Rs. {Number(product.price).toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-gray-600 mb-8">{product.description}</p>

            {/* Product Details */}
            <div className="space-y-3 mb-8 text-sm">
              {product.category && (
                <div className="flex">
                  <span className="font-medium w-24">Category:</span>
                  <span className="text-gray-600">{product.category.name}</span>
                </div>
              )}
              {product.materials && (
                <div className="flex">
                  <span className="font-medium w-24">Materials:</span>
                  <span className="text-gray-600">{product.materials}</span>
                </div>
              )}
              {product.size && (
                <div className="flex">
                  <span className="font-medium w-24">Size:</span>
                  <span className="text-gray-600">{product.size}</span>
                </div>
              )}
              {product.color && (
                <div className="flex">
                  <span className="font-medium w-24">Color:</span>
                  <span className="text-gray-600">{product.color}</span>
                </div>
              )}
              <div className="flex">
                <span className="font-medium w-24">Stock:</span>
                <span className={product.in_stock ? 'text-green-600' : 'text-red-600'}>
                  {product.in_stock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            {product.in_stock && (
              <div className="flex gap-4 mb-6">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>

                <button onClick={handleAddToCart} className="btn-primary flex-1">
                  <ShoppingBagIcon className="w-5 h-5 mr-2" />
                  Add to Cart
                </button>

                <button className="btn-outline p-3">
                  <HeartIcon className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

