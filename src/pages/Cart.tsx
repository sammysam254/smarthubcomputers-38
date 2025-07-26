
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, X, ShoppingBag, CreditCard, Smartphone, Tag } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ShippingAddress {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  county: string | null;
  postal_code: string | null;
  phone: string | null;
}

interface Voucher {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  minimum_purchase_amount: number | null;
  max_uses: number | null;
  used_count: number | null;
}

const Cart = () => {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customAddress, setCustomAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [ncbaLoopMessage, setNcbaLoopMessage] = useState('');
  const [stkPushLoading, setStkPushLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherLoading, setVoucherLoading] = useState(false);
  
  // Shipping location
  const [shippingLocation, setShippingLocation] = useState<'nairobi' | 'kenya'>('nairobi');

  useEffect(() => {
    if (user) {
      fetchShippingAddresses();
      // Pre-fill customer info if available
      setCustomerInfo(prev => ({
        ...prev,
        email: user.email || '',
      }));
    }
  }, [user]);

  // Listen for payment status updates
  useEffect(() => {
    if (!checkoutRequestId) return;

    const channel = supabase
      .channel('ncba-loop-payment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ncba_loop_payments',
          filter: `account_number=eq.${checkoutRequestId}`
        },
        (payload) => {
          console.log('Payment status update:', payload);
          const newStatus = payload.new.status;
          setPaymentStatus(newStatus);
          
          if (newStatus === 'confirmed') {
            toast.success('Payment confirmed! Your order has been placed successfully.');
            clearCart();
            navigate('/my-orders');
          } else if (newStatus === 'failed') {
            toast.error('Payment failed. Please try again.');
            setStkPushLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkoutRequestId]);

  const fetchShippingAddresses = async () => {
    if (!user) return;
    
    try {
      // Shipping addresses feature not implemented yet
      console.log('Shipping addresses feature disabled');
      setShippingAddresses([]);
      
      
      // Default to Nairobi shipping since no shipping addresses table exists
      setShippingLocation('nairobi');
    } catch (error) {
      console.error('Error fetching shipping addresses:', error);
    }
  };

  const initiateSTKPush = async (orderId: string, phoneNumber: string, amount: number) => {
    try {
      setStkPushLoading(true);
      setPaymentStatus('processing');
      
      if (!phoneNumber) {
        toast.error('Phone number is required for NCBA Loop payment');
        return;
      }

      console.log('Initiating STK Push:', { orderId, phoneNumber, amount });

      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          order_id: orderId,
          phone_number: phoneNumber,
          amount: amount,
          account_reference: `Order-${orderId.slice(-8)}`,
          transaction_desc: `Payment for SmartHub Order ${orderId.slice(-8)}`
        }
      });

      if (error) {
        console.error('STK Push error:', error);
        throw error;
      }

      if (data?.success) {
        setCheckoutRequestId(data.CheckoutRequestID);
        setPaymentStatus('stk_sent');
        toast.success('Payment request sent to your phone. Please enter your M-Pesa PIN to complete the payment.');
      } else {
        throw new Error(data?.error || 'Failed to send payment request');
      }

    } catch (error) {
      console.error('STK Push error:', error);
      toast.error('Failed to send payment request. Please try again.');
      setStkPushLoading(false);
      setPaymentStatus('');
    }
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Please enter a voucher code');
      return;
    }

    setVoucherLoading(true);
    try {
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.toUpperCase())
        .eq('active', true)
        .single();

      if (error) {
        toast.error('Invalid voucher code');
        return;
      }

      // Check if voucher has minimum purchase requirement
      if (voucher.min_order_amount && subtotal < voucher.min_order_amount) {
        toast.error(`Minimum purchase amount of KES ${voucher.min_order_amount.toLocaleString()} required`);
        return;
      }

      // Check if voucher has usage limit
      if (voucher.max_uses && voucher.used_count >= voucher.max_uses) {
        toast.error('Voucher usage limit exceeded');
        return;
      }

      // Check if voucher is within date range
      const now = new Date();
      if (voucher.start_date && new Date(voucher.start_date) > now) {
        toast.error('Voucher is not yet active');
        return;
      }
      if (voucher.end_date && new Date(voucher.end_date) < now) {
        toast.error('Voucher has expired');
        return;
      }

      // Calculate discount
      let discount = 0;
      if (voucher.discount_percentage) {
        discount = (subtotal * voucher.discount_percentage) / 100;
      } else if (voucher.discount_amount) {
        discount = Math.min(voucher.discount_amount, subtotal);
      }

      setAppliedVoucher(voucher as any);
      setVoucherDiscount(discount);
      toast.success(`Voucher applied! Discount: KES ${discount.toLocaleString()}`);
    } catch (error) {
      console.error('Error applying voucher:', error);
      toast.error('Failed to apply voucher');
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setVoucherCode('');
    toast.success('Voucher removed');
  };

  const subtotal = totalPrice;
  const shippingFee = shippingLocation === 'nairobi' ? 500 : 700;
  const total = subtotal + shippingFee - voucherDiscount;

  const getShippingAddressText = () => {
    if (selectedAddressId) {
      const address = shippingAddresses.find(addr => addr.id === selectedAddressId);
      if (address) {
        return `${address.name}, ${address.address_line_1}${address.address_line_2 ? ', ' + address.address_line_2 : ''}, ${address.city}${address.county ? ', ' + address.county : ''}${address.postal_code ? ' ' + address.postal_code : ''}`;
      }
    }
    return customAddress;
  };

  // Validate if product ID is a valid UUID
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please sign in to place an order');
      navigate('/auth');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error('Please fill in all customer information');
      return;
    }

    const shippingAddress = getShippingAddressText();
    if (!shippingAddress) {
      toast.error('Please provide a shipping address');
      return;
    }

    if (paymentMethod === 'mpesa' && !mpesaMessage.trim()) {
      toast.error('Please provide M-Pesa transaction details');
      return;
    }

    if (paymentMethod === 'ncba_loop' && !customerInfo.phone) {
      toast.error('Phone number is required for NCBA Loop payment');
      return;
    }

    // Validate product IDs
    const invalidItems = items.filter(item => !isValidUUID(item.id));
    if (invalidItems.length > 0) {
      console.error('Invalid product IDs found:', invalidItems);
      toast.error('Some items in your cart have invalid product IDs. Please refresh the page and try again.');
      return;
    }

    setLoading(true);

    try {
      // Create orders for each item in cart
      for (const item of items) {
        console.log('Creating order for item:', item);
        
        const itemTotal = (item.price * item.quantity);
        const itemShippingFee = (itemTotal / subtotal) * shippingFee;
        const itemVoucherDiscount = (itemTotal / subtotal) * voucherDiscount;
        const itemFinalTotal = itemTotal + itemShippingFee - itemVoucherDiscount;
        
        const orderData = {
          user_id: user.id,
          product_id: item.id,
          quantity: item.quantity,
          total_amount: itemFinalTotal,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone || '0000000000',
          shipping_address: shippingAddress,
          payment_method: paymentMethod,
          status: 'pending'
        };

        console.log('Order data to insert:', orderData);

        const { error: orderError, data: insertedOrder } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          throw orderError;
        }

        console.log('Order created successfully:', insertedOrder);

        // If M-Pesa payment, create M-Pesa payment record
        if (paymentMethod === 'mpesa' && insertedOrder) {
          const mpesaData = {
            order_id: insertedOrder.id,
            amount: itemFinalTotal,
            phone_number: customerInfo.phone || null,
            status: 'pending'
          };

          console.log('Creating M-Pesa payment record:', mpesaData);

          const { error: mpesaError } = await supabase
            .from('mpesa_payments')
            .insert(mpesaData);

          if (mpesaError) {
            console.error('M-Pesa payment creation error:', mpesaError);
            throw mpesaError;
          }
        }

        // If NCBA Loop payment, create NCBA Loop payment record and initiate STK push
        if (paymentMethod === 'ncba_loop' && insertedOrder) {
          const ncbaLoopData = {
            order_id: insertedOrder.id,
            amount: itemFinalTotal,
            phone_number: customerInfo.phone || null,
            status: 'pending'
          };

          console.log('Creating NCBA Loop payment record:', ncbaLoopData);

          const { error: ncbaLoopError } = await supabase
            .from('ncba_loop_payments')
            .insert(ncbaLoopData);

          if (ncbaLoopError) {
            console.error('NCBA Loop payment creation error:', ncbaLoopError);
            throw ncbaLoopError;
          }

          // Initiate STK push after creating the payment record
          await initiateSTKPush(insertedOrder.id, customerInfo.phone!, itemFinalTotal);
          return; // Exit early to prevent showing regular success message
        }

        // If voucher was used, update count
        if (appliedVoucher) {
          const { error: voucherUpdateError } = await supabase
            .from('vouchers')
            .update({ used_count: (appliedVoucher.used_count || 0) + 1 })
            .eq('id', appliedVoucher.id);

          if (voucherUpdateError) {
            console.error('Voucher update error:', voucherUpdateError);
          }
        }
      }

      // Clear cart after successful order
      clearCart();
      
      toast.success('🎉 Thank You for Your Order!\nWe\'re thrilled you chose to shop with us. Your order has been received and is now being prepared with care.\nYou\'ll receive a confirmation email shortly with all the details. In the meantime, sit back and relax—we\'ve got this!\n💌 Need help or have questions? Our support team is just a click away.\nThank you for being part of our story. We can\'t wait for you to enjoy your purchase!');
      navigate('/my-orders');
      
    } catch (error) {
      console.error('Error placing order:', error);
      if (error.message?.includes('invalid input syntax for type uuid')) {
        toast.error('Invalid product information. Please refresh the page and try again.');
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to get started</p>
            <Button onClick={() => navigate('/products')}>
              Continue Shopping
            </Button>
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
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cart Items */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=100&h=100&fit=crop&crop=center'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-primary font-bold">
                        KES {item.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">ID: {item.id}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checkout Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shipping-location">Shipping Location <span className="text-red-500">*</span></Label>
                  <Select value={shippingLocation} onValueChange={(value: 'nairobi' | 'kenya') => setShippingLocation(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shipping location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nairobi">Nairobi (KES 500)</SelectItem>
                      <SelectItem value="kenya">Other parts of Kenya (KES 700)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {shippingAddresses.length > 0 && (
                  <div>
                    <Label htmlFor="saved-address">Select Saved Address</Label>
                    <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a saved address" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Enter custom address</SelectItem>
                        {shippingAddresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {address.name} - {address.address_line_1}, {address.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {!selectedAddressId && (
                  <div>
                    <Label htmlFor="custom-address">Custom Address <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="custom-address"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="Enter your complete shipping address"
                      rows={3}
                    />
                  </div>
                )}
                
                {selectedAddressId && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Selected Address:</p>
                    <p className="text-sm text-muted-foreground">{getShippingAddressText()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voucher Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="h-5 w-5" />
                  <span>Voucher Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!appliedVoucher ? (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter voucher code"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    />
                    <Button 
                      onClick={applyVoucher} 
                      disabled={voucherLoading}
                      variant="outline"
                    >
                      {voucherLoading ? 'Applying...' : 'Apply'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">Voucher Applied: {appliedVoucher.code}</p>
                      <p className="text-sm text-green-600">Discount: KES {voucherDiscount.toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeVoucher}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>M-Pesa (0704144239)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ncba_loop">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>M-Pesa</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cash_on_delivery">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Cash on Delivery</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {paymentMethod === 'mpesa' && (
                  <div>
                    <Label htmlFor="mpesa-details">M-Pesa Transaction Details <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="mpesa-details"
                      value={mpesaMessage}
                      onChange={(e) => setMpesaMessage(e.target.value)}
                      placeholder="Paste your M-Pesa confirmation message here..."
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Send payment to: 0704144239, then paste the confirmation message above.
                    </p>
                  </div>
                )}

                {paymentMethod === 'ncba_loop' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">NCBA Loop STK Push Payment</p>
                      <p className="text-sm text-blue-700">
                        • Click "Place Order" below to receive an STK push on your phone<br/>
                        • Enter your M-Pesa PIN to complete the payment<br/>
                        • Your order will be automatically confirmed once payment is received
                      </p>
                    </div>
                    
                    {paymentStatus && (
                      <div className={`p-3 rounded-lg border ${
                        paymentStatus === 'confirmed' ? 'bg-green-50 border-green-200' :
                        paymentStatus === 'failed' ? 'bg-red-50 border-red-200' :
                        'bg-yellow-50 border-yellow-200'
                      }`}>
                        <p className={`text-sm font-medium ${
                          paymentStatus === 'confirmed' ? 'text-green-800' :
                          paymentStatus === 'failed' ? 'text-red-800' :
                          'text-yellow-800'
                        }`}>
                          Payment Status: {
                            paymentStatus === 'processing' ? 'Processing your order...' :
                            paymentStatus === 'stk_sent' ? 'STK push sent! Check your phone and enter PIN' :
                            paymentStatus === 'confirmed' ? 'Payment confirmed! Order placed successfully' :
                            paymentStatus === 'failed' ? 'Payment failed. Please try again' :
                            paymentStatus
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>KES {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Fee ({shippingLocation === 'nairobi' ? 'Nairobi' : 'Kenya'})</span>
                    <span>KES {shippingFee.toLocaleString()}</span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Voucher Discount</span>
                      <span>-KES {voucherDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>KES {total.toLocaleString()}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6" 
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Cart;
