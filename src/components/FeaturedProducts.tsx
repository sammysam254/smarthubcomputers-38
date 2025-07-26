import { useState, useEffect, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string; // Added description
  images: string[]; // Changed to array of images
  original_price: number | null;
  rating: number;
  reviews_count: number;
  specifications?: Record<string, string>; // Added specifications
  badge: string | null;
  badge_color: string | null;
  in_stock: boolean;
  category: string;
}

const ProductCard = memo(({ product, onAddToCart, onViewDetails }: {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (productId: string) => void;
}) => (
  <div className="group w-full text-left">
    <Card 
      className="hover:shadow-card transition-all duration-300 hover:-translate-y-2 bg-background border-border/50 hover:border-primary/30 h-full cursor-pointer"
      onClick={() => onViewDetails(product.id)}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg aspect-[4/3]">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            width={400}
            height={300}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop&crop=center';
            }}
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
));

ProductCard.displayName = 'ProductCard';

const FeaturedProducts = () => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchFeaturedProducts = async () => {
      try {
        // Check cache first
        const cachedProducts = localStorage.getItem('featuredProducts');
        const cachedTimestamp = localStorage.getItem('featuredProductsTimestamp');
        
        if (cachedProducts && cachedTimestamp && 
            Date.now() - parseInt(cachedTimestamp) < 3600000) {
          if (isMounted) {
            setProducts(JSON.parse(cachedProducts));
            setLoading(false);
          }
          return;
        }

        // Fetch with timeout
        const timeout = setTimeout(() => {
          if (isMounted) setLoading(false);
          controller.abort();
        }, 3000);

        const { data, error } = await supabase
          .from('products')
          .select(`
            id, 
            name, 
            price, 
            description,
            images,
            original_price,
            rating,
            reviews_count,
            badge,
            badge_color,
            in_stock,
            category
          `)
          .eq('in_stock', true)
          .is('deleted_at', null)
          .limit(4)
          .order('created_at', { ascending: false });

        clearTimeout(timeout);

        if (!isMounted) return;
        if (error) throw error;

        const transformedProducts = data?.map(product => ({
          ...product,
          images: Array.isArray(product.images) ? product.images : (product.images ? [product.images] : ['/placeholder-product.jpg']),
          original_price: product.original_price || null,
          rating: product.rating || 5,
          reviews_count: product.reviews_count || 0,
          badge: product.badge || null,
          badge_color: product.badge_color || null,
          in_stock: product.in_stock !== false,
          category: product.category || 'Electronics'
        })) || [];

        if (isMounted) {
          setProducts(transformedProducts);
          setLoading(false);
          localStorage.setItem('featuredProducts', JSON.stringify(transformedProducts));
          localStorage.setItem('featuredProductsTimestamp', Date.now().toString());
        }
      } catch (error) {
        if (isMounted) {
          setLoading(false);
          const cachedProducts = localStorage.getItem('featuredProducts');
          if (cachedProducts) {
            setProducts(JSON.parse(cachedProducts));
          }
        }
      }
    };

    fetchFeaturedProducts();

    return () => {
      isMounted = false;
      controller.abort();
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
            <p className="text-muted-foreground text-lg">Loading our latest products...</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg aspect-[4/3] mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
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
      </div>
    </section>
  );
};

export default memo(FeaturedProducts);
