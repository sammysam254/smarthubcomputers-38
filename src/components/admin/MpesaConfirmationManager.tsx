import { useState, useEffect } from 'react';
import { useAdmin, MpesaPayment } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Phone, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const MpesaConfirmationManager = () => {
  const { fetchMpesaPayments } = useAdmin();
  const [payments, setPayments] = useState<MpesaPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<MpesaPayment | null>(null);
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await fetchMpesaPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error loading M-Pesa payments:', error);
      toast.error('Failed to load M-Pesa payments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string, status: 'confirmed' | 'failed') => {
    try {
      const { error } = await supabase
        .from('mpesa_payments')
        .update({ 
          status, 
          result_desc: status === 'confirmed' ? 'Payment confirmed manually by admin' : 'Payment failed - manually marked by admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      // If payment is confirmed, also update the associated order status
      if (status === 'confirmed') {
        const payment = payments.find(p => p.id === paymentId);
        if (payment?.order_id) {
          const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'processing' })
            .eq('id', payment.order_id);
          
          if (orderError) {
            console.error('Error updating order status:', orderError);
          }
        }
      }

      toast.success(`Payment ${status === 'confirmed' ? 'confirmed' : 'marked as failed'} successfully`);
      setIsConfirmDialogOpen(false);
      setSelectedPayment(null);
      setConfirmationNotes('');
      loadPayments();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      confirmed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      failed: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading M-Pesa payments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">M-Pesa Payment Confirmations ({payments.length})</h3>
        <Button onClick={loadPayments} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['pending', 'confirmed', 'failed', 'completed'].map(status => {
          const count = payments.filter(payment => payment.status === status).length;
          const totalAmount = payments
            .filter(payment => payment.status === status)
            .reduce((sum, payment) => sum + payment.amount, 0);
          
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{status}</div>
                  <div className="text-xs text-muted-foreground">
                    KES {totalAmount.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payments Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-mono text-sm">
                  {payment.transaction_id || payment.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{payment.phone_number}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">KES {payment.amount.toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">
                    {payment.order_id ? payment.order_id.slice(0, 8) : 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(payment.status || 'pending')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {payment.status === 'pending' && (
                      <>
                        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm M-Pesa Payment</DialogTitle>
                              <DialogDescription>
                                Manually confirm this M-Pesa payment transaction
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedPayment && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong>Transaction ID:</strong><br />
                                    {selectedPayment.transaction_id || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Phone Number:</strong><br />
                                    {selectedPayment.phone_number}
                                  </div>
                                  <div>
                                    <strong>Amount:</strong><br />
                                    KES {selectedPayment.amount.toLocaleString()}
                                  </div>
                                  <div>
                                    <strong>Order ID:</strong><br />
                                    {selectedPayment.order_id?.slice(0, 8) || 'N/A'}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor="notes">Confirmation Notes (Optional)</Label>
                                  <Textarea
                                    id="notes"
                                    value={confirmationNotes}
                                    onChange={(e) => setConfirmationNotes(e.target.value)}
                                    placeholder="Add any notes about this confirmation..."
                                    rows={3}
                                  />
                                </div>
                              </div>
                            )}
                            
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsConfirmDialogOpen(false);
                                  setSelectedPayment(null);
                                  setConfirmationNotes('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => selectedPayment && handleConfirmPayment(selectedPayment.id, 'failed')}
                              >
                                Mark as Failed
                              </Button>
                              <Button
                                onClick={() => selectedPayment && handleConfirmPayment(selectedPayment.id, 'confirmed')}
                              >
                                Confirm Payment
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleConfirmPayment(payment.id, 'failed')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {payment.status !== 'pending' && (
                      <Badge variant="outline" className="text-xs">
                        {payment.status === 'confirmed' ? 'Confirmed' : 'Processed'}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {payments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No M-Pesa payments found.
        </div>
      )}

      {/* Pending Payments Alert */}
      {payments.filter(p => p.status === 'pending').length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pending Confirmations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              You have {payments.filter(p => p.status === 'pending').length} M-Pesa payments awaiting manual confirmation.
              Please review and confirm legitimate payments to process the associated orders.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MpesaConfirmationManager;