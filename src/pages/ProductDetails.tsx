import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  images: string[];
  original_price: number | null;
  rating: number;
  reviews_count: number;
  badge: string | null;
  badge_color: string | null;
  in_stock: boolean;
  category: string;
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          price, 
          description,
          images,
          image_urls,
          original_price,
          rating,
          reviews_count,
          badge,
          badge_color,
          in_stock,
          category
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data) {
        let imageUrls: string[] = [];
        
        // Try images first, then image_urls
        if (data.images) {
          try {
            imageUrls = JSON.parse(data.images);
            if (!Array.isArray(imageUrls)) {
              imageUrls = [data.images];
            }
          } catch {
            imageUrls = [data.images];
          }
        } else if (data.image_urls) {
          try {
            imageUrls = JSON.parse(data.image_urls);
            if (!Array.isArray(imageUrls)) {
              imageUrls = [data.image_urls];
            }
          } catch {
            imageUrls = [data.image_urls];
          }
        }

        // Filter out any empty or invalid image URLs
        imageUrls = imageUrls.filter(url => url && !url.includes('lovable-uploads'));

        if (imageUrls.length === 0) {
          imageUrls = ['https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop'];
        }

        const transformedProduct: Product = {
          ...data,
          images: imageUrls,
          original_price: data.original_price || null,
          rating: data.rating || 5,
          reviews_count: data.reviews_count || 0,
          badge: data.badge || null,
          badge_color: data.badge_color || null,
          in_stock: data.in_stock !== false,
          category: data.category || 'Electronics'
        };

        setProduct(transformedProduct);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
      });
      toast.success('Added to cart!');
    }
  };

  const nextImage = () => {
    if (product && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-6 bg-muted rounded w-1/4"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-12 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Button onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=600&fit=crop';
                    }}
                  />
                  
                  {product.badge && (
                    <Badge className={`absolute top-4 left-4 ${product.badge_color || 'bg-primary'} text-white`}>
                      {product.badge}
                    </Badge>
                  )}

                  {product.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Image Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      currentImageIndex === index ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">
                  {product.rating} ({product.reviews_count} reviews)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-primary">
                  KES {product.price.toLocaleString()}
                </span>
                {product.original_price && (
                  <span className="text-xl text-muted-foreground line-through">
                    KES {product.original_price.toLocaleString()}
                  </span>
                )}
              </div>
              {product.original_price && (
                <div className="text-sm text-green-600">
                  Save KES {(product.original_price - product.price).toLocaleString()}
                </div>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Category:</span>
                <Badge variant="secondary">{product.category}</Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-medium">Availability:</span>
                <Badge variant={product.in_stock ? "default" : "destructive"}>
                  {product.in_stock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full"
              onClick={handleAddToCart}
              disabled={!product.in_stock}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetails;