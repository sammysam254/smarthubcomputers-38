import { useState, useEffect, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Zap, Upload, X, Plus } from 'lucide-react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import AdsSection from '@/components/AdsSection';
import Footer from '@/components/Footer';
import InternalLinksSection from '@/components/InternalLinksSection';
import { supabase } from '@/integrations/supabase/client';
import FeaturedProducts from '@/components/FeaturedProducts';

// Lazy load heavy components for better performance
const Categories = lazy(() => import('@/components/Categories'));
// FeaturedProducts is eagerly loaded above for faster first paint

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  start_date: string;
  end_date: string;
  discount_amount: number | null;
  discount_percentage: number | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  product_ids: string[] | null;
  products?: Product[];
}

interface Product {
  id: string;
  name: string;
  images: string;
  image_urls: string;
  price: number;
  category: string;
}

interface PromotionProductCarouselProps {
  products: Product[];
}

const PromotionProductCarousel = ({ products }: PromotionProductCarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % products.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [products.length]);

  const getProductImage = (product: Product) => {
    try {
      const imagesArray = JSON.parse(product.images || '[]');
      const imageUrlsArray = JSON.parse(product.image_urls || '[]');
      const combined = [...(Array.isArray(imagesArray) ? imagesArray : []), ...(Array.isArray(imageUrlsArray) ? imageUrlsArray : [])];
      const httpImage = combined.find((u) => typeof u === 'string' && /^https?:/i.test(u));
      return httpImage || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop';
    } catch {
      return 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop';
    }
  };

  return (
    <div className="relative w-full h-full">
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ 
          transform: `translateX(-${currentImageIndex * 100}%)`,
          width: `${products.length * 100}%`
        }}
      >
        {products.map((product) => (
          <div key={product.id} className="w-full h-full flex-shrink-0" style={{ width: `${100 / products.length}%` }}>
            <img 
              src={getProductImage(product)} 
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop';
              }}
            />
          </div>
        ))}
      </div>
      {/* Image navigation dots */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {products.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full ${
              idx === currentImageIndex 
                ? 'bg-white' 
                : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const Index = () => {
  const { user } = useAuth();
  const { isAdmin, fetchPromotions } = useAdmin();
  const navigate = useNavigate();
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [newPromotion, setNewPromotion] = useState<Partial<Promotion>>({
    title: '',
    description: '',
    active: true,
    start_date: '',
    end_date: '',
    discount_amount: null,
    discount_percentage: null
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadActivePromotions();
    if (isAdmin) {
      fetchProducts();
    }
  }, []);

  useEffect(() => {
    if (activePromotions.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % activePromotions.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activePromotions.length]);

  const loadActivePromotions = async () => {
    try {
      const promotions = await fetchPromotions();
      const active = promotions.filter((promo: any) => promo.active);
      
      // Fetch product details for each promotion
      const promotionsWithProducts = await Promise.all(
        active.map(async (promo: any) => {
          if (promo.product_ids && promo.product_ids.length > 0) {
            const { data: products } = await supabase
              .from('products')
              .select('id, name, images, image_urls, price, category')
              .in('id', promo.product_ids);
            
            return { ...promo, products: products || [] };
          }
          return promo;
        })
      );
      
      setActivePromotions(promotionsWithProducts);
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, images, image_urls, price, category')
        .order('created_at', { ascending: false });
      
      setProducts(products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setNewPromotion(prev => ({
        ...prev,
        title: selectedProduct.name
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // For now, just reload promotions (actual save functionality would use createPromotion from useAdmin)
      await loadActivePromotions();
      resetForm();
    } catch (error) {
      console.error('Error saving promotion:', error);
    }
  };

  const resetForm = () => {
    setNewPromotion({
      title: '',
      description: '',
      active: true,
      start_date: '',
      end_date: '',
      discount_amount: null,
      discount_percentage: null
    });
    setSelectedFile(null);
    setPreviewImage(null);
    setShowAddPromo(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activePromotions.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activePromotions.length) % activePromotions.length);
  };

  return (
    <>
      <Helmet>
        <title>SmartHub Computers - Best Computer Store in Kenya | Laptops, Desktops & Tech</title>
        <meta name="description" content="Kenya's leading computer store offering laptops, desktops, gaming PCs, and tech accessories. Best prices, expert service, and genuine products with warranty in Nairobi." />
        <meta name="keywords" content="computers Kenya, laptops Nairobi, gaming PCs, desktop computers, computer store Kenya, tech accessories, computer shop Nairobi" />
        <meta property="og:title" content="SmartHub Computers - Best Computer Store in Kenya" />
        <meta property="og:description" content="Kenya's leading computer store offering laptops, desktops, gaming PCs, and tech accessories with best prices and expert service." />
        <meta property="og:url" content="https://smarthubcomputers.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://smarthubcomputers.com/lovable-uploads/e794c35d-09b9-447c-9ad8-265176240bde.png" />
        <link rel="canonical" href="https://smarthubcomputers.com/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "SmartHub Computers",
            "description": "Kenya's leading computer store offering laptops, desktops, gaming PCs, and tech accessories",
            "url": "https://smarthubcomputers.com/",
            "logo": "https://smarthubcomputers.com/lovable-uploads/e794c35d-09b9-447c-9ad8-265176240bde.png",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Koinange Street Uniafric House Room 208",
              "addressLocality": "Nairobi",
              "addressCountry": "KE"
            },
            "telephone": "0704144239",
            "email": "support@smarthubcomputers.com",
            "sameAs": [
              "https://www.facebook.com/SmarthubComputersKE",
              "https://www.instagram.com/SmarthubKE",
              "https://twitter.com/SmarthubKE"
            ]
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
      <main>
        <AdsSection />
        <Hero />
        
        {/* Admin Debug Section - Only show to admin users */}
        {user && isAdmin && (
          <div className="container mx-auto px-4 py-4 bg-blue-50 border border-blue-200 rounded-lg mb-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-800 mb-1">
                  Logged in as: {user.email}
                </p>
                <p className="text-sm text-blue-800">
                  Admin status: {isAdmin ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setShowAddPromo(!showAddPromo)} 
                  variant="default" 
                  size="sm"
                  className="flex items-center"
                >
                  {showAddPromo ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                  {showAddPromo ? 'Cancel' : 'Add Promotion'}
                </Button>
                <Link to="/admin">
                  <Button variant="default" size="sm">
                    Admin Panel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Add Promotion Form */}
        {showAddPromo && isAdmin && (
          <div className="container mx-auto px-4 py-6 mb-8 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Add New Promotion</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Promotion Title</label>
                    <Input
                      value={newPromotion.title || ''}
                      onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={newPromotion.description || ''}
                      onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Discount Percentage</label>
                    <Input
                      type="number"
                      value={newPromotion.discount_percentage || ''}
                      onChange={(e) => setNewPromotion({...newPromotion, discount_percentage: parseInt(e.target.value) || null})}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Select Product</label>
                    <Select onValueChange={handleProductSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Discount Amount</label>
                    <Input
                      type="number"
                      value={newPromotion.discount_amount || ''}
                      onChange={(e) => setNewPromotion({...newPromotion, discount_amount: parseFloat(e.target.value) || null})}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <Input
                      type="datetime-local"
                      value={newPromotion.start_date || ''}
                      onChange={(e) => setNewPromotion({...newPromotion, start_date: e.target.value})}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <Input
                      type="datetime-local"
                      value={newPromotion.end_date || ''}
                      onChange={(e) => setNewPromotion({...newPromotion, end_date: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Promotion
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Active Promotions Section */}
        {activePromotions.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">🎉 Special Promotions</h2>
              <p className="text-muted-foreground">Don't miss out on these amazing deals!</p>
            </div>
            
            <div className="relative">
              <div className="flex overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out w-full"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {activePromotions.map((promotion) => {
                    const getProductImage = (product: Product) => {
                      try {
                        const imagesArray = JSON.parse(product.images || '[]');
                        const imageUrlsArray = JSON.parse(product.image_urls || '[]');
                        const combined = [...(Array.isArray(imagesArray) ? imagesArray : []), ...(Array.isArray(imageUrlsArray) ? imageUrlsArray : [])];
                        const httpImage = combined.find((u) => typeof u === 'string' && /^https?:/i.test(u));
                        return httpImage || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop';
                      } catch {
                        return 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop';
                      }
                    };

                    return (
                      <div key={promotion.id} className="w-full flex-shrink-0 px-4">
                        <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-primary/20 hover:border-primary/40 h-full flex flex-col">
                          <CardContent className="p-0 flex flex-col flex-grow">
                            <div className="relative flex-grow">
                              {/* Product images carousel */}
                              {promotion.products && promotion.products.length > 0 ? (
                                <div className="h-48 rounded-t-lg overflow-hidden relative">
                                  {promotion.products.length === 1 ? (
                                    <img 
                                      src={getProductImage(promotion.products[0])} 
                                      alt={promotion.products[0].name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop';
                                      }}
                                    />
                                  ) : (
                                     <PromotionProductCarousel products={promotion.products} />
                                  )}
                                  {promotion.discount_percentage && (
                                    <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 animate-pulse">
                                      {promotion.discount_percentage}% OFF
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
                                  <div className="text-center">
                                    <Zap className="h-12 w-12 text-primary mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Promotional Content</p>
                                    {promotion.discount_percentage && (
                                      <Badge className="bg-red-500 hover:bg-red-600 animate-pulse mt-2">
                                        {promotion.discount_percentage}% OFF
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-6">
                              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {promotion.title}
                              </h3>
                              {promotion.description && (
                                <p className="text-muted-foreground text-sm mb-4">
                                  {promotion.description}
                                </p>
                              )}
                              {promotion.products && promotion.products.length > 0 && (
                                <p className="text-sm text-muted-foreground mb-4">
                                  {promotion.products.length === 1 
                                    ? promotion.products[0].name
                                    : `${promotion.products.length} products on sale`
                                  }
                                </p>
                              )}
                              
                              <Button 
                                className="w-full"
                                onClick={() => {
                                  if (promotion.products && promotion.products.length > 0) {
                                    if (promotion.products.length === 1) {
                                      navigate(`/products/${promotion.products[0].id}`);
                                    } else {
                                      // Navigate to products page with promotion filter
                                      navigate('/products', { 
                                        state: { 
                                          promotionProducts: promotion.products,
                                          promotionTitle: promotion.title 
                                        } 
                                      });
                                    }
                                  }
                                }}
                              >
                                Shop Now
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              <button 
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10 ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10 mr-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Dots Indicator */}
              <div className="flex justify-center mt-6 space-x-2">
                {activePromotions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-primary' : 'bg-gray-300'}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Flash Sale Banner */}
        <section className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-8 mb-8">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 mr-2 animate-pulse" />
              <h2 className="text-3xl font-bold">⚡ Flash Sales Active!</h2>
            </div>
            <p className="text-xl mb-6">Limited time offers with incredible discounts!</p>
            <Link to="/flash-sales">
              <Button size="lg" variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
                <Zap className="h-5 w-5 mr-2" />
                Shop Flash Sales Now
              </Button>
            </Link>
          </div>
        </section>
        
        <FeaturedProducts />
        
        <Suspense fallback={<div className="py-8 text-center">Loading categories...</div>}>
          <Categories />
        </Suspense>

      </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
