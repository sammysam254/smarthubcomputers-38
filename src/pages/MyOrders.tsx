
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Calendar, CreditCard, MapPin, Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeedbackForm from '@/components/FeedbackForm';

interface Order {
  id: string;
  created_at: string;
  quantity: number;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  payment_method: string | null;
  shipping_fee: number | null;
  voucher_discount: number | null;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
}

interface Feedback {
  id: string;
  rating: number;
  shipping_rating: number | null;
  review_text: string | null;
  created_at: string;
}

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback>>({});
  const [loading, setLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchFeedbacks();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (
            id,
            name,
            price,
            image_urls
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform orders to include image_url and add missing properties
      const transformedOrders = data?.map(order => ({
        ...order,
        shipping_fee: null,
        voucher_discount: null,
        products: order.products ? {
          ...order.products,
          image_url: order.products.image_urls ? JSON.parse(order.products.image_urls)[0] : ''
        } : null
      })) || [];
      
      setOrders(transformedOrders as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const feedbackMap: Record<string, Feedback> = {};
      data?.forEach(feedback => {
        const key = `${feedback.order_id}-${feedback.product_id}`;
        feedbackMap[key] = feedback;
      });

      setFeedbacks(feedbackMap);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user?.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Cancel order error:', error);
        
        if (error.message?.includes('violates row-level security policy')) {
          toast.error('You can only cancel pending orders');
        } else {
          toast.error('Failed to cancel order. Please try again.');
        }
        return;
      }

      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Please sign in to view your orders</h2>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">No orders found</h2>
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const feedbackKey = `${order.id}-${order.products?.id}`;
              const hasFeedback = feedbacks[feedbackKey];
              const canProvideFeedback = order.status === 'delivered' && !hasFeedback;
              const canCancel = order.status === 'pending';

              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Package className="h-5 w-5" />
                          <span>Order #{order.id.slice(0, 8)}</span>
                        </CardTitle>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Product Info */}
                    {order.products && (
                      <div className="flex items-center space-x-4">
                        <img
                          src={order.products.image_url || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=100&h=100&fit=crop&crop=center'}
                          alt={order.products.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{order.products.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {order.quantity}
                          </p>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span className="font-medium">Payment:</span>
                          <span>{order.payment_method?.toUpperCase() || 'N/A'}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <div>
                            <span className="font-medium">Shipping Address:</span>
                            <p className="text-muted-foreground">{order.shipping_address}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>KES {(order.total_amount - (order.shipping_fee || 0) + (order.voucher_discount || 0)).toLocaleString()}</span>
                        </div>
                        {order.shipping_fee && (
                          <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>KES {order.shipping_fee.toLocaleString()}</span>
                          </div>
                        )}
                        {order.voucher_discount && order.voucher_discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Voucher Discount:</span>
                            <span>-KES {order.voucher_discount.toLocaleString()}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>KES {order.total_amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Section */}
                    {hasFeedback && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center space-x-2 mb-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">Your Review</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <span>Product:</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= hasFeedback.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {hasFeedback.shipping_rating && (
                            <div className="flex items-center space-x-1">
                              <span>Shipping:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= (hasFeedback.shipping_rating || 0)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {hasFeedback.review_text && (
                          <p className="text-sm text-muted-foreground mt-2">
                            "{hasFeedback.review_text}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {canCancel && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel Order
                        </Button>
                      )}
                      
                      {canProvideFeedback && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFeedbackForm(showFeedbackForm === order.id ? null : order.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {showFeedbackForm === order.id ? 'Hide Review Form' : 'Write Review'}
                        </Button>
                      )}
                    </div>

                    {/* Feedback Form */}
                    {showFeedbackForm === order.id && canProvideFeedback && order.products && (
                      <div className="mt-4">
                        <FeedbackForm
                          orderId={order.id}
                          productId={order.products.id}
                          productName={order.products.name}
                          onSuccess={() => {
                            setShowFeedbackForm(null);
                            fetchFeedbacks();
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default MyOrders;
