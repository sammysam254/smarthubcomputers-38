import { useState, useEffect } from 'react';
import { useAdmin, NcbaLoopPayment } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const NcbaLoopPaymentsManager = () => {
  const { fetchNcbaLoopPayments, confirmNcbaPayment } = useAdmin();
  const [payments, setPayments] = useState<NcbaLoopPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await fetchNcbaLoopPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error loading NCBA Loop payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (id: string) => {
    try {
      await confirmNcbaPayment(id);
      toast.success('Payment confirmed successfully');
      loadPayments();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading NCBA Loop payments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-blue-500" />
          NCBA Loop Payments ({payments.length})
        </h3>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction Ref</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="font-mono text-sm">
                    {payment.transaction_reference || 'Pending'}
                  </div>
                </TableCell>
                <TableCell>{payment.phone_number}</TableCell>
                <TableCell>
                  KES {payment.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      payment.status === 'confirmed' ? 'default' :
                      payment.status === 'failed' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {payment.status || 'pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(payment.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  {payment.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirmPayment(payment.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {payments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No NCBA Loop payments found.
        </div>
      )}
    </div>
  );
};

export default NcbaLoopPaymentsManager;