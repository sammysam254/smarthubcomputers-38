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
  // Only render if product has images
  if (!product.images || product.images.length === 0) {
    return null;
  }

  return (
    <div className="group w-full text-left">
      <Card 
        className="hover:shadow-card transition-all duration-300 hover:-translate-y-2 bg-background border-border/50 hover:border-primary/30 h-full cursor-pointer"
        onClick={(e) => {
          console.log('Card clicked, calling onViewDetails');
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
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>

            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviews_count})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">
                KES {product.price.toLocaleString()}
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
            >
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

const FeaturedProducts = () => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchFeaturedProducts = async () => {
      try {
        // Check cache first (with error handling)
        let cachedProducts = null;
        let cachedTimestamp = null;
        
        try {
          cachedProducts = localStorage.getItem('featuredProducts');
          cachedTimestamp = localStorage.getItem('featuredProductsTimestamp');
        } catch (e) {
          // localStorage might be full or disabled
          console.warn('localStorage access failed:', e);
        }
        
        if (cachedProducts && cachedTimestamp && 
            Date.now() - parseInt(cachedTimestamp) < 300000) { // 5 min cache
          if (isMounted) {
            setProducts(JSON.parse(cachedProducts));
            setLoading(false);
          }
          return;
        }

        // Minimal query - only essential fields
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image_urls, rating, in_stock')
          .eq('in_stock', true)
          .is('deleted_at', null)
          .not('image_urls', 'is', null)
          .limit(4)
          .order('rating', { ascending: false });

        if (!isMounted) return;
        if (error) throw error;

        // Lightweight transform
        const transformedProducts = data?.map(product => {
          let imageUrls: string[] = [];
          
          if (product.image_urls) {
            try {
              imageUrls = JSON.parse(product.image_urls);
              if (!Array.isArray(imageUrls)) imageUrls = [product.image_urls];
            } catch {
              imageUrls = [product.image_urls];
            }
          }

          // Only store essential data
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            images: imageUrls.filter(url => url && url.trim()).slice(0, 1), // Only first image
            description: '',
            original_price: null,
            rating: product.rating || 5,
            reviews_count: 0,
            badge: null,
            badge_color: null,
            in_stock: product.in_stock !== false,
            category: 'Electronics'
          };
        }).filter(product => product.images.length > 0) || [];

        if (isMounted) {
          setProducts(transformedProducts);
          setLoading(false);
          
          // Safe localStorage with minimal data
          try {
            const minimalData = transformedProducts.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              images: p.images.slice(0, 1) // Only first image
            }));
            localStorage.setItem('featuredProducts', JSON.stringify(minimalData));
            localStorage.setItem('featuredProductsTimestamp', Date.now().toString());
          } catch (e) {
            console.warn('Failed to cache products:', e);
            // Continue without caching
          }
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
        if (isMounted) {
          setLoading(false);
          
          // Try to load from cache as fallback
          try {
            const cachedProducts = localStorage.getItem('featuredProducts');
            if (cachedProducts) {
              const parsed = JSON.parse(cachedProducts);
              // Ensure cached data has required fields
              const validProducts = parsed.map((p: any) => ({
                ...p,
                description: p.description || '',
                original_price: p.original_price || null,
                rating: p.rating || 5,
                reviews_count: p.reviews_count || 0,
                badge: p.badge || null,
                badge_color: p.badge_color || null,
                in_stock: p.in_stock !== false,
                category: p.category || 'Electronics'
              }));
              setProducts(validProducts);
            }
          } catch (cacheError) {
            console.warn('Failed to load from cache:', cacheError);
          }
        }
      }
    };

    fetchFeaturedProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
  };

  const handleViewDetails = (productId: string) => {
    console.log('handleViewDetails called with productId:', productId);
    navigate(`/products/${productId}`);
  };

  const handleViewAll = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground text-lg">Discovering amazing products for you...</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-3/4 animate-pulse"></div>
                    <div className="h-10 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded animate-pulse"></div>
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
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured Products
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover our handpicked selection of premium computers and tech products
          </p>
        </div>

        {products.length > 0 ? (
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
