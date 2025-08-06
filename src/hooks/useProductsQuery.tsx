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

// Global cache for products to avoid refetching
const productCache = new Map<string, { data: Product[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProductsQuery = ({ category, sortBy }: UseProductsQueryProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Generate cache key
  const cacheKey = useMemo(() => `${category}-${sortBy}`, [category, sortBy]);

  // Lightning-fast image processing
  const processImages = useCallback((imageUrls: string | null): string[] => {
    if (!imageUrls) return [];
    try {
      const parsed = JSON.parse(imageUrls);
      return Array.isArray(parsed) ? parsed.slice(0, 3) : [imageUrls]; // Limit to 3 images max
    } catch {
      return [imageUrls];
    }
  }, []);

  // Ultra-optimized query builder
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

    // Optimized sorting with database indexes
    switch (sortBy) {
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false }).order('reviews_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    return query;
  }, [category, sortBy]);

  const fetchProducts = useCallback(async (loadMore = false) => {
    if (loading && loadMore) return;

    // Check cache first for initial load
    if (!loadMore) {
      const cached = productCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setProducts(cached.data);
        setLoading(false);
        setHasMore(cached.data.length >= 24);
        return;
      }
    }
    
    setLoading(true);
    
    try {
      const offset = loadMore ? products.length : 0;
      const limit = 24; // Optimized batch size
      
      const query = buildQuery(offset, limit);
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Hyper-optimized transformation
      const transformedProducts = data?.map(product => {
        const images = processImages(product.image_urls);
        return {
          ...product,
          image_url: images[0] || '',
          images,
          description: ''
        };
      }).filter(p => p.images.length > 0) || [];
      
      const newProducts = loadMore ? [...products, ...transformedProducts] : transformedProducts;
      setProducts(newProducts);
      setHasMore(transformedProducts.length === limit);

      // Cache results for initial loads only
      if (!loadMore && transformedProducts.length > 0) {
        productCache.set(cacheKey, {
          data: transformedProducts,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [products.length, buildQuery, processImages, loading, cacheKey]);

  // Reset and fetch when filters change
  useEffect(() => {
    setProducts([]);
    setLoading(true);
    setHasMore(true);
    fetchProducts();
  }, [category, sortBy, buildQuery]);

  return {
    products,
    loading,
    hasMore,
    fetchMore: () => fetchProducts(true)
  };
};