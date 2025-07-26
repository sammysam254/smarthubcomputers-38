import { useState, useEffect } from 'react';
import { useAdmin, Promotion, Product } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Megaphone, Package } from 'lucide-react';
import { toast } from 'sonner';

const PromotionsManager = () => {
  const { 
    fetchPromotions, 
    createPromotion, 
    updatePromotion, 
    deletePromotion,
    fetchProducts
  } = useAdmin();
  
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percentage: '',
    discount_amount: '',
    start_date: '',
    end_date: '',
    active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promotionsData, productsData] = await Promise.all([
        fetchPromotions(),
        fetchProducts()
      ]);
      setPromotions(promotionsData);
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
      const promotionData = {
        title: formData.title,
        description: formData.description,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        active: formData.active,
        product_ids: selectedProducts.length > 0 ? selectedProducts : null,
      };

      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, promotionData);
        toast.success('Promotion updated successfully');
      } else {
        await createPromotion(promotionData);
        toast.success('Promotion created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error('Failed to save promotion');
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description || '',
      discount_percentage: promotion.discount_percentage?.toString() || '',
      discount_amount: promotion.discount_amount?.toString() || '',
      start_date: promotion.start_date,
      end_date: promotion.end_date,
      active: promotion.active || false,
    });
    setSelectedProducts((promotion as any).product_ids || []);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    
    try {
      await deletePromotion(id);
      toast.success('Promotion deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Failed to delete promotion');
    }
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setSelectedProducts([]);
    setFormData({
      title: '',
      description: '',
      discount_percentage: '',
      discount_amount: '',
      start_date: '',
      end_date: '',
      active: true,
    });
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const getSelectedProductNames = (productIds: string[] | null) => {
    if (!productIds || productIds.length === 0) return 'All Products';
    
    const selectedProductNames = productIds.map(id => {
      const product = products.find(p => p.id === id);
      return product ? product.name : 'Unknown Product';
    });
    
    if (selectedProductNames.length > 3) {
      return `${selectedProductNames.slice(0, 3).join(', ')} +${selectedProductNames.length - 3} more`;
    }
    
    return selectedProductNames.join(', ');
  };

  if (loading) {
    return <div className="text-center py-8">Loading promotions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Promotions ({promotions.length})</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
              </DialogTitle>
              <DialogDescription>
                {editingPromotion ? 'Update promotion details' : 'Create a new promotional campaign'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Promotion Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter promotion title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="active">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter promotion description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="e.g., 20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Discount Amount (KES)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                    placeholder="e.g., 1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <Label className="text-base font-medium">Select Products for Promotion</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Leave none selected to apply promotion to all products
                </p>
                
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleProductToggle(product.id)}
                        />
                        <label
                          htmlFor={`product-${product.id}`}
                          className="flex items-center space-x-3 cursor-pointer flex-1"
                        >
                          {product.image_urls && JSON.parse(product.image_urls || '[]').length > 0 && (
                            <img
                              src={JSON.parse(product.image_urls || '[]')[0]}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.category} • KES {product.price.toLocaleString()}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedProducts.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Selected {selectedProducts.length} product(s)
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Promotion</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((promotion) => (
              <TableRow key={promotion.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{promotion.title}</div>
                    {promotion.description && (
                      <div className="text-sm text-muted-foreground">
                        {promotion.description.length > 50 
                          ? `${promotion.description.substring(0, 50)}...` 
                          : promotion.description
                        }
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {promotion.discount_percentage && (
                    <Badge variant="secondary">
                      {promotion.discount_percentage}% OFF
                    </Badge>
                  )}
                  {promotion.discount_amount && (
                    <Badge variant="secondary">
                      KES {promotion.discount_amount.toLocaleString()} OFF
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {getSelectedProductNames((promotion as any).product_ids)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{new Date(promotion.start_date).toLocaleDateString()}</div>
                    <div className="text-muted-foreground">
                      to {new Date(promotion.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={promotion.active ? "default" : "secondary"}>
                    {promotion.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(promotion)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(promotion.id)}
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

      {promotions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No promotions found. Create your first promotion to get started.</p>
        </div>
      )}
    </div>
  );
};

export default PromotionsManager;