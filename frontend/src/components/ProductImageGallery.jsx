/**
 * Product Image Gallery with Multiple Views & Animations
 * Features: Zoom, thumbnails, smooth transitions
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

const ProductImageGallery = ({ mainImage, images = [], productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Combine main image with gallery images
  const allImages = [
    { image: mainImage, alt_text: productName },
    ...images
  ];

  const currentImage = allImages[selectedIndex];

  const handlePrevious = () => {
    setImageLoaded(false);
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setImageLoaded(false);
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    if (index !== selectedIndex) {
      setImageLoaded(false);
      setSelectedIndex(index);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 group">
        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
        )}

        {/* Main Image */}
        <img
          src={currentImage?.image || '/placeholder-product.jpg'}
          alt={currentImage?.alt_text || productName}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Navigation Arrows (only if multiple images) */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm 
                       rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300
                       hover:bg-white hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-800" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm 
                       rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300
                       hover:bg-white hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-neutral-800" />
            </button>
          </>
        )}

        {/* Zoom Button */}
        <button
          onClick={() => setIsZoomed(true)}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg 
                   opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
          aria-label="Zoom image"
        >
          <Maximize2 className="w-5 h-5 text-neutral-800" />
        </button>

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm 
                        rounded-full text-white text-sm font-medium">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {allImages.map((img, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300
                ${
                  selectedIndex === index
                    ? 'border-neutral-900 shadow-md scale-95'
                    : 'border-transparent hover:border-neutral-300 hover:shadow-sm'
                }`}
            >
              <img
                src={img.image || '/placeholder-product.jpg'}
                alt={img.alt_text || `${productName} view ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {selectedIndex === index && (
                <div className="absolute inset-0 bg-neutral-900/10" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full 
                     transition-colors duration-200"
            aria-label="Close zoom"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <img
            src={currentImage?.image || '/placeholder-product.jpg'}
            alt={currentImage?.alt_text || productName}
            className="max-w-full max-h-full object-contain animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation in Zoom Mode */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 
                         rounded-full transition-colors duration-200"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 
                         rounded-full transition-colors duration-200"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 
                            bg-white/10 backdrop-blur-sm rounded-full text-white font-medium">
                {selectedIndex + 1} / {allImages.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
