import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (categoryParam) setCategory(categoryParam);
    if (searchParam) setSearchQuery(searchParam);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [category, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Optimized query - only select needed fields and add pagination
      let query = supabase
        .from('products')
        .select('id, name, price, original_price, image_urls, rating, reviews_count, badge, badge_color, in_stock, category, description')
        .is('deleted_at', null)
        .limit(50); // Add pagination limit for faster initial load
      
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      
      // Apply sorting
      if (sortBy === 'price_low') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price_high') {
        query = query.order('price', { ascending: false });
      } else if (sortBy === 'rating') {
        query = query.order('rating', { ascending: false });
      } else {
        query = query.order('name', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform products to include image_url and images
      const transformedProducts = data?.map(product => {
        let images = [];
        try {
          images = product.image_urls ? JSON.parse(product.image_urls) : [];
        } catch (e) {
          images = [];
        }
        
        return {
          ...product,
          image_url: images[0] || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop&crop=center',
          images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop&crop=center']
        };
      }) || [];
      
      setProducts(transformedProducts);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-64 mb-4"></div>
                <div className="bg-muted rounded h-4 mb-2"></div>
                <div className="bg-muted rounded h-4 w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Our Products</h1>
          <p className="text-muted-foreground text-lg">
            Discover our complete range of computers, laptops, and tech accessories
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
      </div>
      
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      <Footer />
    </div>
  );
};

export default Products;
