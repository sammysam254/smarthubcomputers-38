import { useState, useEffect } from 'react';
import { useAdmin, FlashSale } from '@/hooks/useAdmin';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FlashSaleWithProduct extends FlashSale {
  product?: {
    id: string;
    name: string;
    image_url: string;
    category: string;
    description: string;
  };
}

const FlashSales = () => {
  const { fetchFlashSales } = useAdmin();
  const { addToCart } = useCart();
  const [flashSales, setFlashSales] = useState<FlashSaleWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlashSales();
  }, []);

  const loadFlashSales = async () => {
    try {
      setLoading(true);
      const data = await fetchFlashSales();
      
      // Fetch product details for each flash sale
      const flashSalesWithProducts = await Promise.all(
        data.map(async (sale) => {
          if (sale.product_id) {
            const { data: product } = await supabase
              .from('products')
              .select('id, name, image_urls, category, description')
              .eq('id', sale.product_id)
              .single();
            
            if (product) {
              return {
                ...sale,
                product: {
                  ...product,
                  image_url: (() => {
                    try {
                      const images = product.image_urls ? JSON.parse(product.image_urls) : [];
                      return images[0] || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop&crop=center';
                    } catch {
                      return 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop&crop=center';
                    }
                  })()
                }
              };
            }
          }
          return sale;
        })
      );
      
      setFlashSales(flashSalesWithProducts);
    } catch (error) {
      console.error('Error loading flash sales:', error);
      toast.error('Failed to load flash sales');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const difference = end - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else {
        return `${minutes}m ${seconds}s`;
      }
    }
    return 'Expired';
  };

  const handleAddToCart = (sale: FlashSaleWithProduct) => {
    // Check if flash sale is still active
    const now = new Date();
    const endDate = new Date(sale.end_date);
    
    if (now > endDate) {
      toast.error('Flash sale has ended');
      return;
    }

    if (!sale.product_id || !sale.product) {
      toast.error('Product information not available');
      return;
    }

    // Check if there's enough quantity available
    if (sale.quantity_limit && sale.sold_quantity >= sale.quantity_limit) {
      toast.error('Flash sale quantity limit reached');
      return;
    }

    addToCart({
      id: sale.product_id,
      name: sale.product.name,
      price: sale.sale_price,
      image: sale.product.image_url
    });

    toast.success(`${sale.product.name} added to cart at flash sale price!`);
  };

  const activeFlashSales = flashSales.filter(sale => {
    const now = new Date();
    const startDate = new Date(sale.start_date);
    const endDate = new Date(sale.end_date);
    return now >= startDate && now <= endDate && sale.active;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flash sales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ⚡ Flash Sales
          </h1>
          <p className="text-xl text-gray-600">
            Limited time offers with incredible discounts!
          </p>
        </div>

        {activeFlashSales.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Active Flash Sales
            </h2>
            <p className="text-gray-600">
              Check back later for amazing deals!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeFlashSales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-lg shadow-md overflow-hidden relative">
                <div className="absolute top-2 left-2 z-10">
                  <Badge variant="destructive" className="bg-red-500">
                    -{sale.discount_percentage}%
                  </Badge>
                </div>
                
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {getTimeRemaining(sale.end_date)}
                  </div>
                </div>

                <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  {sale.product?.image_url ? (
                    <img 
                      src={sale.product.image_url} 
                      alt={sale.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop&crop=center';
                      }}
                    />
                  ) : (
                    <span className="text-gray-500">No Image</span>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{sale.product?.name || 'Product'}</h3>
                  <p className="text-sm text-gray-600 mb-3">{sale.product?.description || 'Flash Sale Item'}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg line-through text-gray-500">
                        KES {sale.original_price.toLocaleString()}
                      </span>
                      <span className="text-xl font-bold text-red-600 ml-2">
                        KES {sale.sale_price.toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Save {((sale.original_price - sale.sale_price) / sale.original_price * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  {sale.quantity_limit && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Sold</span>
                        <span>{sale.sold_quantity || 0} / {sale.quantity_limit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(((sale.sold_quantity || 0) / sale.quantity_limit) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleAddToCart(sale)}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={sale.quantity_limit && sale.sold_quantity >= sale.quantity_limit}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {sale.quantity_limit && sale.sold_quantity >= sale.quantity_limit 
                      ? 'Sold Out' 
                      : 'Add to Cart'
                    }
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashSales;