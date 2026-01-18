import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '@/utils/image';

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
}

export default function ImageGallery({ images, initialIndex = 0 }: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setIsOpen(false);
  };

  return (
    <>
      {/* Grid of images */}
      <div className="grid grid-cols-1 gap-2" data-image-gallery>
        {images.length > 0 && (
          <div 
            className="relative w-full aspect-[16/9] rounded-t-3xl overflow-hidden cursor-pointer"
            onClick={() => setIsOpen(true)}
            data-image-index="0"
          >
            <img 
              src={getImageUrl(images[0])} 
              alt="Property"
              className="w-full h-full object-cover hover:opacity-95 transition-opacity"
            />
          </div>
        )}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1, 5).map((image, index) => (
              <div 
                key={index} 
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                onClick={() => {
                  setCurrentIndex(index + 1);
                  setIsOpen(true);
                }}
                data-image-index={index + 1}
              >
                <img 
                  src={getImageUrl(image)} 
                  alt={`Property ${index + 2}`}
                  className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                />
                {index === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-lg font-medium">+{images.length - 5}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X size={24} />
            </button>

            {/* Navigation buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 text-white hover:text-gray-300 z-10"
            >
              <ChevronLeft size={40} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 text-white hover:text-gray-300 z-10"
            >
              <ChevronRight size={40} />
            </button>

            {/* Current image */}
            <div 
              className="w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getImageUrl(images[currentIndex])}
                alt={`Property ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 