import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  content: string | null;
  ad_type: 'text' | 'image' | 'video' | 'product';
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  product_id: string | null;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_urls: string;
}

const AdsSection = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [products, setProducts] = useState<{ [key: string]: Product }>({});
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length === 0) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [ads.length]);

  const fetchAds = async () => {
    try {
      const { data: adsData, error } = await supabase
        .from('ads')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAds((adsData as Ad[]) || []);

      // Fetch products for product ads
      const productIds = adsData?.filter(ad => ad.product_id).map(ad => ad.product_id) || [];
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, price, image_urls')
          .in('id', productIds);

        if (productsData) {
          const productsMap = productsData.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
          }, {} as { [key: string]: Product });
          setProducts(productsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = (ad: Ad) => {
    if (ad.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  const nextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % ads.length);
  };

  const prevAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  if (loading || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentAdIndex];
  const currentProduct = currentAd.product_id ? products[currentAd.product_id] : null;

  const renderAdContent = () => {
    switch (currentAd.ad_type) {
      case 'text':
        return (
          <div className="text-center p-4">
            <h3 className="text-lg font-semibold mb-2">{currentAd.title}</h3>
            {currentAd.content && <p className="text-muted-foreground">{currentAd.content}</p>}
          </div>
        );

      case 'image':
        return (
          <div className="relative">
            {currentAd.image_url && (
              <img
                src={currentAd.image_url}
                alt={currentAd.title}
                className="w-full h-24 object-cover rounded-lg"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
              <h3 className="text-sm font-semibold">{currentAd.title}</h3>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="relative">
            {currentAd.video_url && (
              <video
                src={currentAd.video_url}
                autoPlay
                muted
                loop
                className="w-full h-24 object-cover rounded-lg"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
              <h3 className="text-sm font-semibold">{currentAd.title}</h3>
            </div>
          </div>
        );

      case 'product':
        return currentProduct ? (
          <div className="flex items-center space-x-3 p-3">
            {currentProduct.image_urls && (
              <img
                src={JSON.parse(currentProduct.image_urls)[0]}
                alt={currentProduct.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{currentProduct.name}</h3>
              <p className="text-primary font-bold">KSh {currentProduct.price}</p>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-muted/50 py-2">
      <div className="container mx-auto px-4">
        <Card className="relative max-w-4xl mx-auto">
          <CardContent className="p-0">
            <div
              className={`relative ${currentAd.link_url ? 'cursor-pointer' : ''}`}
              onClick={() => handleAdClick(currentAd)}
            >
              {renderAdContent()}
            </div>

            {ads.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={prevAd}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={nextAd}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {ads.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentAdIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdsSection;