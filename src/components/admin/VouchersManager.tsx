
import { useState, useEffect } from 'react';
import { useAdmin, Voucher } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Ticket } from 'lucide-react';
import { toast } from 'sonner';

const VouchersManager = () => {
  const { 
    fetchVouchers, 
    createVoucher, 
    updateVoucher, 
    deleteVoucher 
  } = useAdmin();
  
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_purchase_amount: '',
    max_uses: '',
    start_date: '',
    end_date: '',
    active: true
  });

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const data = await fetchVouchers();
      setVouchers(data);
    } catch (error) {
      console.error('Error loading vouchers:', error);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       const voucherData = {
         code: formData.code.toUpperCase(),
         discount_percentage: formData.discount_type === 'percentage' ? parseFloat(formData.discount_value) : null,
         discount_amount: formData.discount_type === 'fixed' ? parseFloat(formData.discount_value) : null,
         min_order_amount: formData.minimum_purchase_amount ? parseFloat(formData.minimum_purchase_amount) : null,
         max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
         start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
         end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
         active: formData.active,
         used_count: 0
       };

      if (editingVoucher) {
        await updateVoucher(editingVoucher.id, voucherData);
      } else {
        await createVoucher(voucherData);
      }

      resetForm();
      loadVouchers();
    } catch (error) {
      console.error('Error saving voucher:', error);
      toast.error('Failed to save voucher');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      minimum_purchase_amount: '',
      max_uses: '',
      start_date: '',
      end_date: '',
      active: true
    });
    setEditingVoucher(null);
    setIsCreateDialogOpen(false);
  };

   const handleEdit = (voucher: Voucher) => {
     setFormData({
       code: voucher.code,
       discount_type: voucher.discount_percentage ? 'percentage' : 'fixed',
       discount_value: (voucher.discount_percentage || voucher.discount_amount || 0).toString(),
       minimum_purchase_amount: voucher.min_order_amount?.toString() || '',
       max_uses: voucher.max_uses?.toString() || '',
       start_date: voucher.start_date ? new Date(voucher.start_date).toISOString().slice(0, 16) : '',
       end_date: voucher.end_date ? new Date(voucher.end_date).toISOString().slice(0, 16) : '',
       active: voucher.active
     });
     setEditingVoucher(voucher);
     setIsCreateDialogOpen(true);
   };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this voucher?')) {
      try {
        await deleteVoucher(id);
        loadVouchers();
      } catch (error) {
        console.error('Error deleting voucher:', error);
        toast.error('Failed to delete voucher');
      }
    }
  };

  const isVoucherExpired = (voucher: Voucher) => {
    if (!voucher.end_date) return false;
    return new Date(voucher.end_date) < new Date();
  };

  const isVoucherMaxedOut = (voucher: Voucher) => {
    if (!voucher.max_uses) return false;
    return (voucher.used_count || 0) >= voucher.max_uses;
  };

  if (loading) {
    return <div className="text-center py-8">Loading vouchers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <Ticket className="h-5 w-5 mr-2 text-green-500" />
          Vouchers ({vouchers.length})
        </h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Voucher Code</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="SAVE20"
                      required
                    />
                    <Button type="button" variant="outline" onClick={generateVoucherCode}>
                      Generate
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="active">Active</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select 
                    value={formData.discount_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, discount_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (KES)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(KES)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimum_purchase_amount">Minimum Purchase Amount (KES)</Label>
                  <Input
                    id="minimum_purchase_amount"
                    type="number"
                    step="0.01"
                    value={formData.minimum_purchase_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_purchase_amount: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <Label htmlFor="max_uses">Max Uses</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date (Optional)</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingVoucher ? 'Update' : 'Create'} Voucher
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min. Purchase</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.map((voucher) => (
              <TableRow key={voucher.id}>
                <TableCell>
                  <div className="font-mono font-bold text-lg">
                    {voucher.code}
                  </div>
                </TableCell>
                 <TableCell>
                   <Badge variant="secondary">
                     {voucher.discount_percentage 
                       ? `${voucher.discount_percentage}%` 
                       : `KES ${voucher.discount_amount || 0}`
                     }
                   </Badge>
                 </TableCell>
                 <TableCell>
                   {voucher.min_order_amount 
                     ? `KES ${voucher.min_order_amount.toLocaleString()}` 
                     : 'No minimum'
                   }
                 </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{voucher.used_count || 0} used</div>
                    {voucher.max_uses && (
                      <div className="text-muted-foreground">
                        of {voucher.max_uses} max
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {voucher.start_date && (
                      <div>From: {new Date(voucher.start_date).toLocaleDateString()}</div>
                    )}
                    {voucher.end_date && (
                      <div>Until: {new Date(voucher.end_date).toLocaleDateString()}</div>
                    )}
                    {!voucher.start_date && !voucher.end_date && (
                      <span className="text-muted-foreground">No expiry</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge 
                      variant={
                        !voucher.active ? 'secondary' :
                        isVoucherExpired(voucher) ? 'destructive' :
                        isVoucherMaxedOut(voucher) ? 'destructive' : 
                        'default'
                      }
                    >
                      {!voucher.active ? 'Inactive' :
                       isVoucherExpired(voucher) ? 'Expired' :
                       isVoucherMaxedOut(voucher) ? 'Maxed Out' : 
                       'Active'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(voucher)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(voucher.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {vouchers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No vouchers found. Create your first voucher to offer discounts to customers.
        </div>
      )}
    </div>
  );
};

export default VouchersManager;
