import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, ShoppingCart, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductModal from '@/components/ProductModal';
import SEOBreadcrumbs from '@/components/SEOBreadcrumbs';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  images: string[];
  category: string;
  rating: number;
  reviews_count: number;
  badge: string | null;
  badge_color: string | null;
  in_stock: boolean;
  description: string | null;
}

const Products = () => {
  console.log('Products component is rendering');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  console.log('Current location:', location.pathname);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { addToCart } = useCart();

  // Category metadata for SEO
  const categoryMeta = {
    'laptops': {
      title: 'Laptops - SmartHub Computers | Buy Premium Laptops in Kenya',
      description: 'Shop premium laptops at SmartHub Computers. Wide selection of gaming laptops, business laptops, and ultrabooks with competitive prices and warranty in Kenya.',
      keywords: 'laptops Kenya, gaming laptops, business laptops, MacBook, Dell laptops, HP laptops, Lenovo laptops'
    },
    'desktops': {
      title: 'Desktop Computers - SmartHub Computers | Custom PCs & Workstations',
      description: 'Browse desktop computers and custom PCs at SmartHub Computers. Gaming desktops, workstations, and office computers with latest specifications.',
      keywords: 'desktop computers Kenya, gaming PCs, custom computers, workstations, office computers'
    },
    'components': {
      title: 'Computer Components - SmartHub Computers | PC Parts & Hardware',
      description: 'Find quality computer components and PC parts at SmartHub Computers. CPUs, GPUs, RAM, motherboards, storage drives and more.',
      keywords: 'computer components Kenya, PC parts, CPU, GPU, RAM, motherboard, SSD, hard drives'
    },
    'peripherals': {
      title: 'Computer Peripherals - SmartHub Computers | Accessories & Devices',
      description: 'Shop computer peripherals and accessories at SmartHub Computers. Keyboards, mice, monitors, webcams, speakers and more.',
      keywords: 'computer peripherals Kenya, keyboards, mice, monitors, webcams, computer accessories'
    },
    'gaming': {
      title: 'Gaming Equipment - SmartHub Computers | Gaming PCs & Accessories',
      description: 'Discover gaming equipment at SmartHub Computers. Gaming PCs, graphics cards, gaming keyboards, mice, headsets and accessories.',
      keywords: 'gaming equipment Kenya, gaming PCs, gaming keyboards, gaming mice, gaming headsets, graphics cards'
    },
    'audio': {
      title: 'Audio Equipment - SmartHub Computers | Speakers & Headphones',
      description: 'Quality audio equipment at SmartHub Computers. Computer speakers, headphones, microphones, and audio accessories.',
      keywords: 'audio equipment Kenya, computer speakers, headphones, microphones, sound systems'
    },
    'printers': {
      title: 'Printers - SmartHub Computers | Office Printers & Scanners',
      description: 'Find reliable printers and scanners at SmartHub Computers. Inkjet printers, laser printers, multifunction printers for office and home.',
      keywords: 'printers Kenya, laser printers, inkjet printers, scanners, office printers'
    },
    'phones': {
      title: 'Mobile Phones - SmartHub Computers | Smartphones & Accessories',
      description: 'Browse smartphones and mobile accessories at SmartHub Computers. Latest Android phones, iPhones, and mobile accessories.',
      keywords: 'smartphones Kenya, mobile phones, Android phones, iPhone, phone accessories'
    },
    'refurbished phones': {
      title: 'Refurbished Phones - SmartHub Computers | Quality Used Smartphones',
      description: 'Quality refurbished smartphones at SmartHub Computers. Tested and certified used phones with warranty at affordable prices.',
      keywords: 'refurbished phones Kenya, used smartphones, second hand phones, affordable phones'
    }
  };

  const getCurrentCategory = () => {
    const path = location.pathname;
    const categoryFromPath = path.substring(1);
    
    if (categoryFromPath && categoryFromPath !== 'products') {
      const categoryMap: { [key: string]: string } = {
        'laptops': 'laptops',
        'desktops': 'desktops', 
        'components': 'components',
        'peripherals': 'peripherals',
        'gaming': 'gaming',
        'audio': 'audio',
        'printers': 'printers',
        'phones': 'phones',
        'refurbished-phones': 'refurbished phones'
      };
      return categoryMap[categoryFromPath] || '';
    }
    return '';
  };

  const currentCategory = getCurrentCategory();
  const categoryInfo = categoryMeta[currentCategory as keyof typeof categoryMeta];

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    // Set category based on URL path
    if (currentCategory) {
      setCategory(currentCategory);
    } else if (categoryParam) {
      setCategory(categoryParam);
    }
    
    if (searchParam) setSearchQuery(searchParam);
  }, [searchParams, currentCategory]);

  useEffect(() => {
    setProducts([]); // Clear products when filters change
    fetchProducts();
  }, [category, sortBy]);

  const fetchProducts = async (loadMore = false) => {
    console.log('fetchProducts called', { loadMore, category, sortBy, loading });
    if (loading && loadMore) {
      console.log('Skipping fetch - already loading and is loadMore');
      return;
    }
    
    setLoading(true);
    
    try {
      const offset = loadMore ? products.length : 0;
      const limit = 12; // Optimized batch size
      
      console.log('Building query with', { offset, limit, category });
      
      // Ultra-optimized query with indexes
      let query = supabase
        .from('products')
        .select('id, name, price, original_price, image_urls, rating, reviews_count, badge, badge_color, in_stock, category')
        .eq('in_stock', true)
        .is('deleted_at', null)
        .not('image_urls', 'is', null)
        .range(offset, offset + limit - 1);
      
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      
      // Optimized sorting
      switch (sortBy) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      console.log('Executing query...');
      const { data, error } = await query;
      
      console.log('Query result:', { data, error });
      
      if (error) throw error;
      
      // Fast transform with minimal processing
      const transformedProducts = data?.map(product => {
        let images = [];
        try {
          images = product.image_urls ? JSON.parse(product.image_urls) : [];
          if (!Array.isArray(images)) images = [product.image_urls];
        } catch (e) {
          images = product.image_urls ? [product.image_urls] : [];
        }
        
        return {
          ...product,
          image_url: images[0] || '',
          images: images,
          description: ''
        };
      }).filter(p => p.images.length > 0) || [];
      
      if (loadMore) {
        setProducts(prev => [...prev, ...transformedProducts]);
      } else {
        setProducts(transformedProducts);
      }
      
      setHasMore(transformedProducts.length === limit);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'laptops', label: 'Laptops' },
    { value: 'desktops', label: 'Desktops' },
    { value: 'components', label: 'Components' },
    { value: 'peripherals', label: 'Peripherals' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'audio', label: 'Audio' },
    { value: 'printers', label: 'Printers' },
    { value: 'phones', label: 'Phones' },
    { value: 'refurbished phones', label: 'Refurbished Phones' },
  ];

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
    });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 animate-pulse bg-muted rounded h-12 w-64 mx-auto"></h1>
            <div className="animate-pulse bg-muted rounded h-6 w-96 mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/20 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                  <div className="p-2 md:p-4 space-y-2 md:space-y-3">
                    <div className="h-4 md:h-5 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse"></div>
                    <div className="h-3 md:h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-3/4 animate-pulse"></div>
                    <div className="h-8 md:h-10 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{categoryInfo?.title || 'Products - SmartHub Computers | Computer Store in Kenya'}</title>
        <meta name="description" content={categoryInfo?.description || 'Shop computers, laptops, components and accessories at SmartHub Computers. Quality products, competitive prices, and expert service in Kenya.'} />
        <meta name="keywords" content={categoryInfo?.keywords || 'computers Kenya, laptops, desktops, computer components, SmartHub Computers'} />
        <meta property="og:title" content={categoryInfo?.title || 'Products - SmartHub Computers'} />
        <meta property="og:description" content={categoryInfo?.description || 'Shop computers, laptops, components and accessories at SmartHub Computers.'} />
        <meta property="og:url" content={`https://smarthubcomputers.com${location.pathname}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://smarthubcomputers.com/lovable-uploads/e794c35d-09b9-447c-9ad8-265176240bde.png" />
        <link rel="canonical" href={`https://smarthubcomputers.com${location.pathname}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "SmartHub Computers",
            "description": categoryInfo?.description || "Computer store specializing in laptops, desktops, and accessories",
            "url": `https://smarthubcomputers.com${location.pathname}`,
            "logo": "https://smarthubcomputers.com/lovable-uploads/e794c35d-09b9-447c-9ad8-265176240bde.png",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Koinange Street Uniafric House Room 208",
              "addressLocality": "Nairobi",
              "addressCountry": "KE"
            },
            "telephone": "0704144239",
            "email": "support@smarthubcomputers.com"
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <SEOBreadcrumbs />
          
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {currentCategory ? `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Products` : 'Our Products'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {categoryInfo?.description || 'Discover our complete range of computers, laptops, and tech accessories'}
            </p>
          </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-card transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <div className="relative w-full h-full bg-gray-100">
                      <img
                        src={product.images?.[0] || product.image_url || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop&crop=center'}
                        alt={product.name}
                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                      
                      {product.images?.length > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
                          {product.images.map((_, index) => (
                            <div
                              key={index}
                              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-gray-300'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {product.badge && (
                      <Badge className={`absolute top-2 left-2 text-xs md:text-sm ${product.badge_color || 'bg-primary'} text-white`}>
                        {product.badge}
                      </Badge>
                    )}
                    
                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-2 md:p-4 space-y-2 md:space-y-3">
                    <h3 
                      className="font-semibold text-sm md:text-lg line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleProductClick(product)}
                    >
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 md:h-4 md:w-4 ${
                              i < Math.floor(product.rating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        ({product.reviews_count})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
                      <span className="text-base md:text-2xl font-bold text-primary">
                        KES {product.price.toLocaleString()}
                      </span>
                      {product.original_price && (
                        <span className="text-xs md:text-sm text-muted-foreground line-through">
                          KES {product.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <Button
                      variant="cart"
                      size="sm"
                      className="w-full text-xs md:text-sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.in_stock}
                    >
                      <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Load More Button */}
        {hasMore && !loading && filteredProducts.length > 0 && (
          <div className="text-center mt-8">
            <Button 
              onClick={() => fetchProducts(true)} 
              variant="outline"
              className="min-w-32"
            >
              Load More Products
            </Button>
          </div>
        )}
      </div>
      
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
        <Footer />
      </div>
    </>
  );
};

export default Products;
