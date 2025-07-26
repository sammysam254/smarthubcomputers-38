import { useState, useEffect } from 'react';
import { useAdmin, MpesaPayment } from '@/hooks/useAdmin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

const MpesaPaymentsManager = () => {
  const { fetchMpesaPayments } = useAdmin();
  const [payments, setPayments] = useState<MpesaPayment[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading M-Pesa payments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-500" />
          M-Pesa Payments ({payments.length})
        </h3>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="font-mono text-sm">
                    {payment.transaction_id || 'Pending'}
                  </div>
                </TableCell>
                <TableCell>{payment.phone_number}</TableCell>
                <TableCell>
                  KES {payment.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      payment.status === 'completed' ? 'default' :
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
    </div>
  );
};

export default MpesaPaymentsManager;