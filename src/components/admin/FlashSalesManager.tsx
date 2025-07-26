
import { useState, useEffect } from 'react';
import { useAdmin, FlashSale, Product } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const FlashSalesManager = () => {
  const { 
    fetchFlashSales, 
    createFlashSale, 
    updateFlashSale, 
    deleteFlashSale,
    fetchProducts 
  } = useAdmin();
  
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFlashSale, setEditingFlashSale] = useState<FlashSale | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    original_price: '',
    sale_price: '',
    discount_percentage: '',
    start_date: '',
    end_date: '',
    quantity_limit: '',
    active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flashSalesData, productsData] = await Promise.all([
        fetchFlashSales(),
        fetchProducts()
      ]);
      setFlashSales(flashSalesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const flashSaleData = {
        product_id: formData.product_id,
        original_price: parseFloat(formData.original_price),
        sale_price: parseFloat(formData.sale_price),
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        quantity_limit: formData.quantity_limit ? parseInt(formData.quantity_limit) : null,
        active: formData.active,
        sold_quantity: 0
      };

      if (editingFlashSale) {
        await updateFlashSale(editingFlashSale.id, flashSaleData);
      } else {
        await createFlashSale(flashSaleData);
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving flash sale:', error);
      toast.error('Failed to save flash sale');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      original_price: '',
      sale_price: '',
      discount_percentage: '',
      start_date: '',
      end_date: '',
      quantity_limit: '',
      active: true
    });
    setEditingFlashSale(null);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (flashSale: FlashSale) => {
    setFormData({
      product_id: flashSale.product_id,
      original_price: flashSale.original_price.toString(),
      sale_price: flashSale.sale_price.toString(),
      discount_percentage: flashSale.discount_percentage.toString(),
      start_date: new Date(flashSale.start_date).toISOString().slice(0, 16),
      end_date: new Date(flashSale.end_date).toISOString().slice(0, 16),
      quantity_limit: flashSale.quantity_limit?.toString() || '',
      active: flashSale.active
    });
    setEditingFlashSale(flashSale);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this flash sale?')) {
      try {
        await deleteFlashSale(id);
        loadData();
      } catch (error) {
        console.error('Error deleting flash sale:', error);
        toast.error('Failed to delete flash sale');
      }
    }
  };

  const calculateDiscount = () => {
    const original = parseFloat(formData.original_price);
    const sale = parseFloat(formData.sale_price);
    if (original && sale && original > sale) {
      const discount = ((original - sale) / original * 100).toFixed(2);
      setFormData(prev => ({ ...prev, discount_percentage: discount }));
    }
  };

  useEffect(() => {
    calculateDiscount();
  }, [formData.original_price, formData.sale_price]);

  if (loading) {
    return <div className="text-center py-8">Loading flash sales...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <Zap className="h-5 w-5 mr-2 text-yellow-500" />
          Flash Sales ({flashSales.length})
        </h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Flash Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFlashSale ? 'Edit Flash Sale' : 'Create New Flash Sale'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select 
                    value={formData.product_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="original_price">Original Price (KES)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="sale_price">Sale Price (KES)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="discount_percentage">Discount %</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    step="0.01"
                    value={formData.discount_percentage}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quantity_limit">Quantity Limit (Optional)</Label>
                <Input
                  id="quantity_limit"
                  type="number"
                  value={formData.quantity_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity_limit: e.target.value }))}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFlashSale ? 'Update' : 'Create'} Flash Sale
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
              <TableHead>Product</TableHead>
              <TableHead>Original Price</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flashSales.map((sale) => (
              <TableRow key={sale.id}>
                 <TableCell>
                   <div className="flex items-center space-x-2">
                     <span className="font-medium">Product ID: {sale.product_id}</span>
                   </div>
                 </TableCell>
                <TableCell>KES {sale.original_price.toLocaleString()}</TableCell>
                <TableCell>KES {sale.sale_price.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="destructive">-{sale.discount_percentage}%</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{new Date(sale.start_date).toLocaleDateString()}</div>
                    <div className="text-muted-foreground">
                      to {new Date(sale.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={sale.active ? 'default' : 'secondary'}>
                    {sale.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(sale)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(sale.id)}
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

      {flashSales.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No flash sales found. Create your first flash sale to get started.
        </div>
      )}
    </div>
  );
};

export default FlashSalesManager;
