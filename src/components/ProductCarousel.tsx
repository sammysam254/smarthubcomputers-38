import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProductSlide {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  price: number;
  link: string;
}

const PRODUCT_SLIDES: ProductSlide[] = [
  {
    id: 'laptops-1',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1200&h=600&fit=crop&auto=format',
    title: 'Premium Laptops',
    category: 'Computers',
    price: 89999,
    link: '/category/laptops'
  },
  {
    id: 'phones-1',
    imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=1200&h=600&fit=crop&auto=format',
    title: 'Latest Smartphones',
    category: 'Mobile',
    price: 49999,
    link: '/category/phones'
  },
  {
    id: 'printers-1',
    imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop&auto=format',
    title: 'High-Speed Printers',
    category: 'Office',
    price: 24999,
    link: '/category/printers'
  },
  {
    id: 'gaming-1',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop&auto=format',
    title: 'Gaming Gear',
    category: 'Gaming',
    price: 12999,
    link: '/category/gaming'
  },
  {
    id: 'audio-1',
    imageUrl: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=1200&h=600&fit=crop&auto=format',
    title: 'Premium Audio',
    category: 'Audio',
    price: 17999,
    link: '/category/audio'
  },
  {
    id: 'monitors-1',
    imageUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1200&h=600&fit=crop&auto=format',
    title: '4K Monitors',
    category: 'Displays',
    price: 35999,
    link: '/category/monitors'
  }
];

const ProductCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();

  // Initialize component and auto-play
  useEffect(() => {
    setIsMounted(true);
    startAutoPlay();
    
    return () => {
      clearInterval(intervalRef.current);
      setIsMounted(false);
    };
  }, []);

  const startAutoPlay = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isHovered && isMounted) {
        setCurrentSlide(prev => (prev + 1) % PRODUCT_SLIDES.length);
      }
    }, 5000);
  }, [isHovered, isMounted]);

  const goToSlide = useCallback((index: number) => {
    if (!isMounted) return;
    setCurrentSlide(index);
    startAutoPlay();
  }, [isMounted, startAutoPlay]);

  const goToPrev = useCallback(() => {
    if (!isMounted) return;
    setCurrentSlide(prev => (prev - 1 + PRODUCT_SLIDES.length) % PRODUCT_SLIDES.length);
    startAutoPlay();
  }, [isMounted, startAutoPlay]);

  const goToNext = useCallback(() => {
    if (!isMounted) return;
    setCurrentSlide(prev => (prev + 1) % PRODUCT_SLIDES.length);
    startAutoPlay();
  }, [isMounted, startAutoPlay]);

  const handleNavigate = (link: string) => {
    navigate(link);
  };

  // Preload images
  useEffect(() => {
    PRODUCT_SLIDES.forEach(slide => {
      const img = new Image();
      img.src = slide.imageUrl;
    });
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] md:h-[500px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
    );
  }

  return (
    <section 
      className="relative w-full h-[400px] md:h-[500px] bg-gray-100 dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={carouselRef}
    >
      {/* Slides Container */}
      <div 
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {PRODUCT_SLIDES.map((slide) => (
          <div 
            key={slide.id}
            className="w-full flex-shrink-0 relative"
          >
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/1200x600.png?text=Product+Image';
                target.classList.add('object-contain', 'bg-gray-200', 'dark:bg-gray-700');
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 flex items-center p-8 md:p-16">
              <div className="max-w-lg space-y-4">
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-primary text-white">
                  {slide.category}
                </span>
                <h2 className="text-2xl md:text-4xl font-bold text-white">
                  {slide.title}
                </h2>
                <p className="text-xl md:text-2xl font-semibold text-white">
                  From KES {slide.price.toLocaleString()}
                </p>
                <Button
                  variant="tech"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate(slide.link);
                  }}
                  className="mt-4"
                >
                  Shop Now
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {PRODUCT_SLIDES.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg transition-all z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg transition-all z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {PRODUCT_SLIDES.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {PRODUCT_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 w-2 md:h-3 md:w-3 rounded-full transition-all ${
                currentSlide === index ? 'bg-white w-6 md:w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductCarousel;
