import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useProductsQuery } from '@/hooks/useProductsQuery';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductModal from '@/components/ProductModal';
import ProductCard from '@/components/ProductCard';
import SEOBreadcrumbs from '@/components/SEOBreadcrumbs';

// Move category metadata outside component to prevent recreation
const CATEGORY_META = {
  'laptops': {
    title: 'Laptops - SmartHub Computers | Buy Premium Laptops in Kenya',
    description: 'Shop premium laptops at SmartHub Computers. Wide selection of gaming laptops, business laptops, and ultrabooks with competitive prices and warranty in Kenya.',
    keywords: 'laptops Kenya, gaming laptops, business laptops, MacBook, Dell laptops, HP laptops, Lenovo laptops'
  },
  // ... (keep other category metadata the same)
};

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'laptops', label: 'Laptops' },
  // ... (keep other categories the same)
];

const Products = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart } = useCart();

  // Memoized current category calculation
  const currentCategory = useMemo(() => {
    const path = location.pathname;
    const categoryFromPath = path.substring(1);
    
    if (categoryFromPath && categoryFromPath !== 'products') {
      const categoryMap: Record<string, string> = {
        'laptops': 'laptops',
        'desktops': 'desktops', 
        // ... (keep other mappings the same)
      };
      return categoryMap[categoryFromPath] || '';
    }
    return '';
  }, [location.pathname]);

  const categoryInfo = CATEGORY_META[currentCategory as keyof typeof CATEGORY_META] || {};

  // Optimized products query with debouncing
  const { products, loading, hasMore, fetchMore } = useProductsQuery({ 
    category, 
    sortBy,
    initialLimit: 12, // Load more initially
    fetchLimit: 8    // Subsequent loads
  });

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Optimized filtered products with memoization
  const filteredProducts = useMemo(() => {
    if (!debouncedQuery) return products;
    const query = debouncedQuery.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.category && product.category.toLowerCase().includes(query))
    );
  }, [products, debouncedQuery]);

  // Memoized handlers
  const handleAddToCart = useCallback((product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || product.images?.[0] || '',
    });
  }, [addToCart]);

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (currentCategory) {
      setCategory(currentCategory);
    } else if (categoryParam) {
      setCategory(categoryParam);
    }
    
    if (searchParam) setSearchQuery(searchParam);
  }, [searchParams, currentCategory]);

  // Preload modal component
  useEffect(() => {
    if (filteredProducts.length > 0) {
      import('@/components/ProductModal');
    }
  }, [filteredProducts.length]);

  if (loading && products.length === 0) {
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
                    <div className="h-4 md:h-5 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 md:h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                    <div className="h-8 md:h-10 bg-muted rounded animate-pulse"></div>
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
        <title>{categoryInfo.title || 'Products - SmartHub Computers | Computer Store in Kenya'}</title>
        <meta name="description" content={categoryInfo.description || 'Shop computers, laptops, components and accessories at SmartHub Computers.'} />
        {/* Keep other meta tags the same */}
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <SEOBreadcrumbs />
          
          {/* Optimized Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {currentCategory ? `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Products` : 'Our Products'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {categoryInfo.description || 'Discover our complete range of computers, laptops, and tech accessories'}
            </p>
          </div>

          {/* Optimized Filters */}
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
                {CATEGORIES.map((cat) => (
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

          {/* Virtualized Products Grid would be better for huge lists */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onProductClick={handleProductClick}
                />
              ))}
            </div>
          )}
          
          {/* Load More Button */}
          {hasMore && !loading && filteredProducts.length > 0 && (
            <div className="text-center mt-8">
              <Button 
                onClick={fetchMore} 
                variant="outline"
                className="min-w-32"
              >
                Load More Products
              </Button>
            </div>
          )}
        </div>
        
        {isModalOpen && selectedProduct && (
          <ProductModal
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}
        
        <Footer />
      </div>
    </>
  );
};

export default Products;
