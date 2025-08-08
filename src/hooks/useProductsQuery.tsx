import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
const INITIAL_LIMIT = 12; // smaller initial payload for faster first paint
const PAGE_LIMIT = 24; // batch size for subsequent loads
const NEXT_PREFETCH_LIMIT = 12; // background prefetch size
const LOCAL_CACHE_PREFIX = 'products_cache_v1:';

export const useProductsQuery = ({ category, sortBy }: UseProductsQueryProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const requestIdRef = useRef(0);

  // Generate cache key
  const cacheKey = useMemo(() => `${category}-${sortBy}`, [category, sortBy]);

  const hydrateFromCache = useCallback(() => {
    const cached = productCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProducts(cached.data);
      setLoading(false);
      setHasMore(cached.data.length >= INITIAL_LIMIT);
      return true;
    }
    try {
      const raw = localStorage.getItem(LOCAL_CACHE_PREFIX + cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: Product[]; timestamp: number };
        if (Date.now() - parsed.timestamp < CACHE_DURATION && parsed.data?.length) {
          setProducts(parsed.data);
          setLoading(false);
          setHasMore(parsed.data.length >= INITIAL_LIMIT);
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }, [cacheKey]);

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

  const fetchProducts = useCallback(async (loadMore = false, silent = false) => {
    if (loading && loadMore) return;

    const reqId = ++requestIdRef.current;

    if (!loadMore && !silent) {
      setLoading(true);
    }

    try {
      const offset = loadMore ? products.length : 0;
      const limit = loadMore ? PAGE_LIMIT : INITIAL_LIMIT; // smaller initial payload

      const query = buildQuery(offset, limit);
      const { data, error } = await query;

      if (reqId !== requestIdRef.current) return; // ignore stale responses

      if (error) throw error;

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
        const newProducts = [...products, ...transformedProducts];
        setProducts(newProducts);
        setHasMore(transformedProducts.length === limit);
      } else {
        setProducts(transformedProducts);
        setHasMore(transformedProducts.length === limit || transformedProducts.length >= INITIAL_LIMIT);

        // Cache initial results in-memory and in localStorage
        const cachePayload = { data: transformedProducts, timestamp: Date.now() };
        productCache.set(cacheKey, cachePayload);
        try {
          localStorage.setItem(LOCAL_CACHE_PREFIX + cacheKey, JSON.stringify(cachePayload));
        } catch {}

        // Background prefetch next chunk to make next interactions instant
        (async () => {
          try {
            const prefetchOffset = transformedProducts.length;
            const { data: more, error: prefetchError } = await buildQuery(prefetchOffset, NEXT_PREFETCH_LIMIT);
            if (!prefetchError && more) {
              const transformedMore = more.map(p => {
                const imgs = processImages(p.image_urls);
                return { ...p, image_url: imgs[0] || '', images: imgs, description: '' };
              }).filter(p => p.images.length > 0);
              const merged = [...transformedProducts, ...transformedMore];
              const mergedPayload = { data: merged, timestamp: Date.now() };
              productCache.set(cacheKey, mergedPayload);
              try {
                localStorage.setItem(LOCAL_CACHE_PREFIX + cacheKey, JSON.stringify(mergedPayload));
              } catch {}
            }
          } catch {
            // ignore
          }
        })();
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      if (!loadMore) {
        setProducts([]);
        setHasMore(false);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [products, buildQuery, processImages, loading, cacheKey]);


  // Reset and fetch when filters change
  useEffect(() => {
    setProducts([]);
    setHasMore(true);
    const hydrated = hydrateFromCache();
    fetchProducts(false, hydrated);
  }, [category, sortBy, buildQuery, hydrateFromCache]);


  return {
    products,
    loading,
    hasMore,
    fetchMore: () => fetchProducts(true)
  };
};