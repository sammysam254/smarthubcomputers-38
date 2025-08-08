import { useState, useEffect, memo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import OptimizedImage from './OptimizedImage';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  original_price: number | null;
  rating: number;
  reviews_count: number;
  specifications?: Record<string, string>;
  badge: string | null;
  badge_color: string | null;
  in_stock: boolean;
  category: string;
}

const ProductCard = memo(({ product, onAddToCart, onViewDetails }: {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (productId: string) => void;
}) => {
  if (!product.images || product.images.length === 0) {
    return null;
  }

  return (
    <article className="group w-full text-left" itemScope itemType="https://schema.org/Product">
      <Card 
        className="hover:shadow-card transition-all duration-300 hover:-translate-y-2 bg-background border-border/50 hover:border-primary/30 h-full cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onViewDetails(product.id);
        }}
      >
        <CardContent className="p-0">
          <div className="relative overflow-hidden rounded-t-lg aspect-[4/3]">
            <OptimizedImage
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              width={400}
              height={300}
              loading="lazy"
              itemProp="image"
            />
            
            {product.badge && (
              <Badge className={`absolute top-3 left-3 ${product.badge_color || 'bg-primary'} text-white`}>
                {product.badge}
              </Badge>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(product.id);
                }}
                aria-label={`View details for ${product.name}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="tech" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product);
                }}
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2" itemProp="name">
              {product.name}
            </h3>

            <div className="flex items-center space-x-2" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                <span itemProp="ratingValue">{product.rating}</span> (<span itemProp="reviewCount">{product.reviews_count}</span>)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                <span itemProp="priceCurrency" content="KES">KES</span> <span itemProp="price">{product.price.toLocaleString()}</span>
              </span>
              {product.original_price && (
                <span className="text-sm text-muted-foreground line-through">
                  KES {product.original_price.toLocaleString()}
                </span>
              )}
            </div>

            <Button 
              variant="cart" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              aria-label={`Add ${product.name} to cart`}
            >
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

const FeaturedProducts = () => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      // Try to get cached products immediately
      const cachedProducts = localStorage.getItem('featuredProducts');
      const cachedTimestamp = localStorage.getItem('featuredProductsTimestamp');
      
      if (cachedProducts && cachedTimestamp && Date.now() - parseInt(cachedTimestamp) < 300000) {
        setProducts(JSON.parse(cachedProducts));
        setLoading(false);
        return true; // Return true if cache was used
      }

      // Start fetching from server
      const fetchPromise = supabase
        .from('products')
        .select('id, name, price, image_urls, rating, in_stock')
        .eq('in_stock', true)
        .is('deleted_at', null)
        .not('image_urls', 'is', null)
        .limit(4)
        .order('rating', { ascending: false });

      // Wait for either cache or network with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 2500)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) throw error;

      const transformedProducts = data?.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.image_urls ? JSON.parse(product.image_urls).slice(0, 1) : [],
        description: '',
        original_price: null,
        rating: product.rating || 5,
        reviews_count: 0,
        badge: null,
        badge_color: null,
        in_stock: product.in_stock !== false,
        category: 'Electronics'
      })) || [];

      setProducts(transformedProducts);
      
      // Cache the minimal data
      localStorage.setItem('featuredProducts', JSON.stringify(transformedProducts));
      localStorage.setItem('featuredProductsTimestamp', Date.now().toString());
      
      return true;
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load products. Please try again later.');
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let fallbackTimer: NodeJS.Timeout;

    const loadProducts = async () => {
      // Try to load from cache or network quickly
      const success = await fetchProducts();
      
      if (!success && isMounted) {
        // If initial fetch fails, show loading for at least 1.5s to prevent flash
        fallbackTimer = setTimeout(() => {
          if (isMounted) {
            setLoading(false);
          }
        }, 1500);
      } else if (isMounted) {
        setLoading(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [fetchProducts]);

  const handleAddToCart = useCallback((product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
  }, [addToCart]);

  const handleViewDetails = useCallback((productId: string) => {
    navigate(`/products/${productId}`);
  }, [navigate]);

  const handleViewAll = useCallback(() => {
    navigate('/products');
  }, [navigate]);

  // Render skeleton if loading
  if (loading) {
    return (
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h1>
            <p className="text-muted-foreground text-lg">Discovering amazing products for you...</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/20 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Featured Products
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover our handpicked selection of premium computers and tech products
          </p>
        </header>

        {error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchProducts();
              }}
            >
              Retry
            </Button>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCart}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg" onClick={handleViewAll}>
                View All Products
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No featured products available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(FeaturedProducts);
