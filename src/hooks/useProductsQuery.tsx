import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface UseProductsQueryProps {
  category: string;
  sortBy: string;
}

export const useProductsQuery = ({ category, sortBy }: UseProductsQueryProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Optimized image processing function
  const processImages = useCallback((imageUrls: string | null): string[] => {
    if (!imageUrls) return [];
    try {
      const parsed = JSON.parse(imageUrls);
      return Array.isArray(parsed) ? parsed : [imageUrls];
    } catch {
      return [imageUrls];
    }
  }, []);

  // Memoized query builder
  const buildQuery = useCallback((offset: number, limit: number) => {
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

    // Optimized sorting with indexed columns
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

    return query;
  }, [category, sortBy]);

  const fetchProducts = useCallback(async (loadMore = false) => {
    if (loading && loadMore) return;
    
    setLoading(true);
    
    try {
      const offset = loadMore ? products.length : 0;
      const limit = 24; // Increased batch size for better performance
      
      const query = buildQuery(offset, limit);
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Lightning-fast transformation with minimal processing
      const transformedProducts = data?.map(product => {
        const images = processImages(product.image_urls);
        return {
          ...product,
          image_url: images[0] || '',
          images,
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
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [products.length, buildQuery, processImages, loading]);

  // Reset and fetch when filters change
  useEffect(() => {
    setProducts([]);
    setLoading(true);
    fetchProducts();
  }, [category, sortBy, buildQuery]);

  return {
    products,
    loading,
    hasMore,
    fetchMore: () => fetchProducts(true)
  };
};