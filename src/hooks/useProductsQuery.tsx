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

// Enhanced cache with memory management
const productCache = new Map<string, { 
  data: Product[]; 
  timestamp: number;
  count: number; // Track how many times this cache is used
}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const INITIAL_LIMIT = 8; // Smaller initial payload for faster first paint
const PAGE_LIMIT = 16; // Balanced batch size for subsequent loads
const LOCAL_CACHE_PREFIX = 'products_cache_v2:';

// Image optimization constants
const MAX_IMAGES = 2; // Only keep 2 images per product
const IMAGE_QUALITY = 'low'; // Can be 'low' | 'medium' | 'high'

export const useProductsQuery = ({ category, sortBy }: UseProductsQueryProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController>();

  // Generate cache key with versioning
  const cacheKey = useMemo(() => `${LOCAL_CACHE_PREFIX}${category}-${sortBy}`, [category, sortBy]);

  // Memory-optimized cache hydration
  const hydrateFromCache = useCallback(() => {
    // First try memory cache
    const cached = productCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProducts(cached.data.slice(0, INITIAL_LIMIT)); // Only show initial set
      setLoading(false);
      setHasMore(cached.data.length > INITIAL_LIMIT);
      
      // Update cache usage count
      productCache.set(cacheKey, {
        ...cached,
        count: (cached.count || 0) + 1
      });
      
      return true;
    }

    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: Product[]; timestamp: number };
        if (Date.now() - parsed.timestamp < CACHE_DURATION && parsed.data?.length) {
          // Store in memory cache for faster access
          productCache.set(cacheKey, {
            data: parsed.data,
            timestamp: parsed.timestamp,
            count: 1
          });
          
          setProducts(parsed.data.slice(0, INITIAL_LIMIT));
          setLoading(false);
          setHasMore(parsed.data.length > INITIAL_LIMIT);
          return true;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    
    return false;
  }, [cacheKey]);

  // Ultra-fast image processor with CDN optimization
  const processImages = useCallback((imageUrls: string | null): string[] => {
    if (!imageUrls) return [];
    
    try {
      // Fast path for single image
      if (typeof imageUrls === 'string') {
        return [optimizeImageUrl(imageUrls)];
      }
      
      // Handle array of images
      const parsed = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls;
      return Array.isArray(parsed) 
        ? parsed.slice(0, MAX_IMAGES).map(optimizeImageUrl)
        : [optimizeImageUrl(imageUrls)];
    } catch {
      return [];
    }
  }, []);

  // CDN image optimization helper
  const optimizeImageUrl = (url: string): string => {
    if (!url) return '';
    
    // Skip if already optimized
    if (url.includes('?') || !url.startsWith('http')) return url;
    
    // Add CDN optimization parameters
    return `${url}?width=400&height=300&quality=${IMAGE_QUALITY}&format=webp`;
  };

  // Query builder with index hints
  const buildQuery = useCallback((offset: number, limit: number) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // Select only needed fields
    let query = supabase
      .from('products')
      .select('id, name, price, original_price, image_urls, rating, reviews_count, badge, badge_color, in_stock')
      .eq('in_stock', true)
      .is('deleted_at', null)
      .not('image_urls', 'is', null)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    // Optimized sorting
    switch (sortBy) {
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false, nullsFirst: false })
                    .order('reviews_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    return query;
  }, [category, sortBy]);

  // Core fetch function with multiple optimizations
  const fetchProducts = useCallback(async (loadMore = false, silent = false) => {
    if (loading && loadMore) return;

    const reqId = ++requestIdRef.current;
    const offset = loadMore ? products.length : 0;
    const limit = loadMore ? PAGE_LIMIT : INITIAL_LIMIT;

    if (!loadMore && !silent) {
      setLoading(true);
    }

    try {
      const query = buildQuery(offset, limit);
      const { data, error } = await query;

      // Ignore stale responses
      if (reqId !== requestIdRef.current) return;

      if (error) throw error;

      // Fast product transformation
      const transformProduct = (product: any): Product => {
        const processedImages = processImages(product.image_urls);
        return {
          ...product,
          description: null,
          category: product.category || 'general',
          images: processedImages,
          image_url: processedImages[0] || ''
        };
      };

      const transformedProducts = (data || [])
        .map(transformProduct)
        .filter(p => p.images.length > 0);

      if (loadMore) {
        setProducts(prev => [...prev, ...transformedProducts]);
        setHasMore(transformedProducts.length === limit);
      } else {
        setProducts(transformedProducts);
        setHasMore(transformedProducts.length >= limit);

        // Cache results
        const cachePayload = { 
          data: transformedProducts, 
          timestamp: Date.now(),
          count: 1
        };
        
        productCache.set(cacheKey, cachePayload);
        
        // Async cache write to avoid blocking
        requestIdleCallback(() => {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
          } catch (e) {
            console.warn('LocalStorage write failed:', e);
          }
        });

        // Background prefetch
        if (transformedProducts.length > 0) {
          setTimeout(() => {
            fetchProducts(true, true).catch(() => {});
          }, 1000);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
        if (!loadMore) {
          setProducts([]);
          setHasMore(false);
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [products, loading, buildQuery, processImages, cacheKey]);

  // Initial load with cache-first strategy
  useEffect(() => {
    const hydrated = hydrateFromCache();
    if (!hydrated) {
      fetchProducts(false, false);
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [category, sortBy, hydrateFromCache]);

  // Cache cleanup on unmount
  useEffect(() => {
    return () => {
      // Prune least used cache entries
      if (productCache.size > 10) {
        const entries = Array.from(productCache.entries());
        entries.sort((a, b) => (a[1].count || 0) - (b[1].count || 0));
        for (let i = 0; i < Math.floor(entries.length / 2); i++) {
          productCache.delete(entries[i][0]);
        }
      }
    };
  }, []);

  return {
    products,
    loading,
    hasMore,
    fetchMore: () => fetchProducts(true)
  };
};
