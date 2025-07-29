import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;
export type Order = Tables<'orders'>;
export type UserProfile = Tables<'profiles'>;
export type Voucher = Tables<'vouchers'>;
export type FlashSale = Tables<'flash_sales'>;
export type Promotion = Tables<'promotions'>;
export type SupportTicket = Tables<'support_tickets'>;
export type TicketMessage = Tables<'ticket_messages'>;
export type MpesaPayment = Tables<'mpesa_payments'>;
export type NcbaLoopPayment = Tables<'ncba_loop_payments'>;

// Extended type to include email for admin user management
export interface ExtendedUserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
}

// Cache for role to avoid repeated calls
let roleCache: { role: string | null; timestamp: number; userId: string } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Check cache first
    if (roleCache && 
        roleCache.userId === user.id && 
        (Date.now() - roleCache.timestamp) < CACHE_DURATION) {
      setIsAdmin(roleCache.role === 'admin');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const adminStatus = data?.role === 'admin';
      
      // Update cache
      roleCache = {
        role: data?.role || null,
        timestamp: Date.now(),
        userId: user.id
      };

      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // Optimized Products with pagination
  const fetchProducts = useCallback(async (limit = 50, offset = 0): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }, []);

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  // Optimized Orders with pagination
  const fetchOrders = useCallback(async (limit = 50, offset = 0): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }, []);

  const makeUserAdmin = async (userId: string) => {
    // First check if user has a profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Create new profile with admin role
      const { error } = await supabase
        .from('profiles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;
    }
  };

  const removeUserAdmin = async (userId: string) => {
    // First check if user has a profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Create new profile with user role
      const { error } = await supabase
        .from('profiles')
        .insert({ user_id: userId, role: 'user' });

      if (error) throw error;
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  };

  // Users
  const fetchUsers = async (): Promise<ExtendedUserProfile[]> => {
    try {
      // Get all profiles (with admin RLS policy allowing access)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profileError) throw profileError;
      
      // For each profile, we have user_id but need to get email from auth
      // Since admin API might not be available, we'll show what we can
      const users: ExtendedUserProfile[] = (profiles || []).map(profile => ({
        ...profile,
        email: 'Email not available via admin API'
      }));
      
      return users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      throw error;
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('user_id', userId);

    if (error) throw error;
  };

  // Vouchers
  const fetchVouchers = async (): Promise<Voucher[]> => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const createVoucher = async (voucherData: Omit<Voucher, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data, error } = await supabase
      .from('vouchers')
      .insert({
        ...voucherData,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateVoucher = async (id: string, voucherData: Partial<Voucher>) => {
    const { data, error } = await supabase
      .from('vouchers')
      .update(voucherData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteVoucher = async (id: string) => {
    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  // Optimized Flash Sales with pagination
  const fetchFlashSales = useCallback(async (limit = 20, offset = 0): Promise<FlashSale[]> => {
    const { data, error } = await supabase
      .from('flash_sales')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }, []);

  const createFlashSale = async (flashSaleData: Omit<FlashSale, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data, error } = await supabase
      .from('flash_sales')
      .insert({
        ...flashSaleData,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateFlashSale = async (id: string, flashSaleData: Partial<FlashSale>) => {
    const { data, error } = await supabase
      .from('flash_sales')
      .update(flashSaleData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteFlashSale = async (id: string) => {
    const { error } = await supabase
      .from('flash_sales')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  // Optimized Promotions with pagination  
  const fetchPromotions = useCallback(async (limit = 20, offset = 0): Promise<Promotion[]> => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }, []);

  const createPromotion = async (promotionData: Omit<Promotion, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        ...promotionData,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updatePromotion = async (id: string, promotionData: Partial<Promotion>) => {
    const { data, error } = await supabase
      .from('promotions')
      .update(promotionData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deletePromotion = async (id: string) => {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  // Support Tickets
  const fetchSupportTickets = async (): Promise<SupportTicket[]> => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const updateTicketStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  };

  // M-Pesa Payments
  const fetchMpesaPayments = async (): Promise<MpesaPayment[]> => {
    const { data, error } = await supabase
      .from('mpesa_payments')
      .select(`
        *,
        orders (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  // NCBA Loop Payments
  const fetchNcbaLoopPayments = async (): Promise<NcbaLoopPayment[]> => {
    const { data, error } = await supabase
      .from('ncba_loop_payments')
      .select(`
        *,
        orders (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const confirmNcbaPayment = async (id: string) => {
    const { error } = await supabase
      .from('ncba_loop_payments')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: user?.id
      })
      .eq('id', id);

    if (error) throw error;
  };

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    isAdmin,
    loading,
    // Products
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    // Orders
    fetchOrders,
    updateOrderStatus,
    // Users
    fetchUsers,
    updateUserRole,
    // Vouchers
    fetchVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    // Flash Sales
    fetchFlashSales,
    createFlashSale,
    updateFlashSale,
    deleteFlashSale,
    // Promotions
    fetchPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    // Support
    fetchSupportTickets,
    updateTicketStatus,
    // Payments
    fetchMpesaPayments,
    fetchNcbaLoopPayments,
    confirmNcbaPayment,
    // User management
    makeUserAdmin,
    removeUserAdmin,
    // Utility
    refreshAdminStatus: checkAdminStatus
  }), [
    isAdmin,
    loading,
    fetchProducts,
    fetchOrders,
    fetchFlashSales,
    fetchPromotions,
    checkAdminStatus
  ]);
};