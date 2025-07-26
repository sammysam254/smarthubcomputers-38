
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroCarousel = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Array of hero slides organized by categories
  const heroSlides = [
    // Laptops
    {
      id: 1,
      category: "Laptops",
      brand: "MacBook Pro",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=6000&q=80",
      title: "Premium Laptops",
      description: "Professional laptops for creators, developers, and business professionals"
    },
    {
      id: 2,
      category: "Laptops",
      brand: "Dell XPS",
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=4846&q=80",
      title: "Ultra-Thin Performance",
      description: "Sleek design meets powerful performance in our laptop collection"
    },
    {
      id: 3,
      category: "Laptops",
      brand: "ThinkPad",
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=5472&q=80",
      title: "Business Excellence",
      description: "Reliable and secure laptops designed for professional productivity"
    },

    // Phones
    {
      id: 4,
      category: "Phones",
      brand: "iPhone Pro",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=5184&q=80",
      title: "Latest Smartphones",
      description: "Cutting-edge mobile technology with advanced cameras and features"
    },
    {
      id: 5,
      category: "Phones",
      brand: "Samsung Galaxy",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Android Innovation",
      description: "Flagship Android devices with stunning displays and powerful processors"
    },
    {
      id: 6,
      category: "Phones",
      brand: "Google Pixel",
      image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Pure Android Experience",
      description: "AI-powered photography and seamless Google integration"
    },

    // Refurbished Phones
    {
      id: 7,
      category: "Refurbished Phones",
      brand: "Certified Refurbished",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Quality Refurbished",
      description: "Premium smartphones at unbeatable prices with full warranty"
    },
    {
      id: 8,
      category: "Refurbished Phones",
      brand: "Like-New Condition",
      image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Eco-Friendly Choice",
      description: "Sustainable technology solutions without compromising on quality"
    },

    // Printers
    {
      id: 9,
      category: "Printers",
      brand: "HP LaserJet",
      image: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Office Printers",
      description: "High-quality printing solutions for home and office environments"
    },
    {
      id: 10,
      category: "Printers",
      brand: "Canon PIXMA",
      image: "https://images.unsplash.com/photo-1596636020776-0ceef0f5ac63?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Photo Printing",
      description: "Professional photo printers for stunning image reproduction"
    },

    // Gaming Items
    {
      id: 11,
      category: "Gaming",
      brand: "Gaming Laptops",
      image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Ultimate Gaming Power",
      description: "High-performance gaming laptops with RTX graphics and fast displays"
    },
    {
      id: 12,
      category: "Gaming",
      brand: "Gaming Desktops",
      image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Custom Gaming Rigs",
      description: "Build your dream gaming setup with premium RGB components"
    },
    {
      id: 13,
      category: "Gaming",
      brand: "Gaming Setup",
      image: "https://images.unsplash.com/photo-1616763355548-1b606f439f86?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Complete Battle Station",
      description: "Everything you need for the ultimate gaming experience"
    },

    // Components
    {
      id: 14,
      category: "Components",
      brand: "Graphics Cards",
      image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "RTX & Radeon GPUs",
      description: "Latest graphics cards for gaming and professional workloads"
    },
    {
      id: 15,
      category: "Components",
      brand: "Processors",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=3543&q=80",
      title: "Intel & AMD CPUs",
      description: "High-performance processors for every computing need"
    },
    {
      id: 16,
      category: "Components",
      brand: "Memory & Storage",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?ixlib=rb-4.0.3&auto=format&fit=crop&w=5760&q=80",
      title: "RAM & SSD Drives",
      description: "Fast memory and storage solutions for peak performance"
    },
    {
      id: 17,
      category: "Components",
      brand: "Motherboards",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Premium Motherboards",
      description: "Feature-rich motherboards for your custom build"
    },

    // Audio Items
    {
      id: 18,
      category: "Audio",
      brand: "Premium Headphones",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Studio-Quality Audio",
      description: "Professional headphones for audiophiles and content creators"
    },
    {
      id: 19,
      category: "Audio",
      brand: "Wireless Earbuds",
      image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "True Wireless Freedom",
      description: "Premium earbuds with active noise cancellation"
    },
    {
      id: 20,
      category: "Audio",
      brand: "Studio Setup",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Professional Audio",
      description: "Complete studio solutions for music production and podcasting"
    },

    // Peripherals
    {
      id: 21,
      category: "Peripherals",
      brand: "Mechanical Keyboards",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Precision Typing",
      description: "Mechanical keyboards with customizable switches and RGB lighting"
    },
    {
      id: 22,
      category: "Peripherals",
      brand: "Gaming Mice",
      image: "https://images.unsplash.com/photo-1527814050087-3793815479db?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Precision Control",
      description: "High-DPI gaming mice with customizable buttons and RGB"
    },
    {
      id: 23,
      category: "Peripherals",
      brand: "Monitor Setup",
      image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Multi-Monitor Setup",
      description: "Professional monitors for productivity and content creation"
    },

    // Desktops
    {
      id: 24,
      category: "Desktops",
      brand: "Workstations",
      image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Professional Workstations",
      description: "High-performance desktop computers for demanding applications"
    },
    {
      id: 25,
      category: "Desktops",
      brand: "All-in-One PCs",
      image: "https://images.unsplash.com/photo-1551831653-6178e1830a5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=80",
      title: "Space-Saving Design",
      description: "Elegant all-in-one computers perfect for modern workspaces"
    }
  ];

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative bg-gradient-to-br from-background via-secondary/20 to-accent/10 py-8 md:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Carousel Container */}
          <div className="relative h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-card">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Mobile Layout */}
                <div className="flex flex-col lg:hidden h-full">
                  {/* Image Section for Mobile */}
                  <div className="relative h-[250px] w-full">
                    <img 
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent"></div>
                  </div>
                  
                  {/* Content Section for Mobile */}
                  <div className="flex-1 space-y-4 px-6 py-6 bg-background">
                    <div className="space-y-3">
                      <div className="text-xs text-primary font-semibold uppercase tracking-wider">
                        {slide.brand}
                      </div>
                      <h1 className="text-2xl font-bold text-foreground leading-tight">
                        {slide.title}
                      </h1>
                      <p className="text-base text-muted-foreground">
                        {slide.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button 
                        variant="hero" 
                        size="default" 
                        className="group w-full"
                        onClick={() => navigate('/products')}
                      >
                        Shop Now
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="default"
                        className="w-full"
                        onClick={() => navigate('/products')}
                      >
                        View Catalog
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-2 gap-8 items-center h-full">
                  {/* Content */}
                  <div className="space-y-6 px-6 md:px-12 py-8">
                    <div className="space-y-4">
                      <div className="text-sm text-primary font-semibold uppercase tracking-wider">
                        {slide.brand}
                      </div>
                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                        {slide.title}
                      </h1>
                      <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                        {slide.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        variant="hero" 
                        size="lg" 
                        className="group"
                        onClick={() => navigate('/products')}
                      >
                        Shop Now
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => navigate('/products')}
                      >
                        View Catalog
                      </Button>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative h-full">
                    <img 
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background/50 lg:to-background/80"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 md:p-3 rounded-full shadow-md z-10 transition-all duration-200"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 md:p-3 rounded-full shadow-md z-10 transition-all duration-200"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
          </button>

        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
