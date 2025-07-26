import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
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
import { Plus, Edit, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ProductsManager = () => {
  const { 
    fetchProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    isAdmin,
    loading: adminLoading
  } = useAdmin();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category: '',
    images: [] as File[],
    badge: '',
    badge_color: 'bg-blue-500',
    rating: '0',
    reviews_count: '0',
    in_stock: true,
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviews]);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    const newPreviews = [...previewImages];
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFormData(prev => ({ ...prev, images: newImages }));
    setPreviewImages(newPreviews);
    
    if (currentImageIndex >= newPreviews.length && newPreviews.length > 0) {
      setCurrentImageIndex(newPreviews.length - 1);
    } else if (newPreviews.length === 0) {
      setCurrentImageIndex(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      // Convert images to base64
      const base64Images = await Promise.all(
        formData.images.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category: formData.category,
        image_urls: JSON.stringify(base64Images), // Keep for backward compatibility
        images: JSON.stringify(base64Images), // Save to images field
        badge: formData.badge,
        badge_color: formData.badge_color,
        rating: parseFloat(formData.rating),
        reviews_count: parseInt(formData.reviews_count),
        in_stock: formData.in_stock,
        deleted_at: null,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }

      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      category: product.category,
      images: [],
      badge: product.badge || '',
      badge_color: product.badge_color || 'bg-blue-500',
      rating: product.rating.toString(),
      reviews_count: product.reviews_count.toString(),
      in_stock: product.in_stock,
    });
    
    // Parse existing images
    try {
      const existingImages = product.images ? JSON.parse(product.images) : [];
      setPreviewImages(existingImages);
    } catch (error) {
      console.error('Error parsing existing images:', error);
      setPreviewImages([]);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This will mark it as deleted instead of permanently removing it.')) return;
    
    try {
      // Use soft delete approach instead of hard delete
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error.message?.includes('foreign key constraint')) {
        toast.error('Cannot delete product - it has existing orders. Use soft delete instead.');
      } else {
        toast.error('Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      original_price: '',
      category: '',
      images: [],
      badge: '',
      badge_color: 'bg-blue-500',
      rating: '0',
      reviews_count: '0',
      in_stock: true,
    });
    setPreviewImages([]);
    setCurrentImageIndex(0);
  };

  const badgeColors = [
    { value: 'bg-blue-500', label: 'Blue' },
    { value: 'bg-green-500', label: 'Green' },
    { value: 'bg-red-500', label: 'Red' },
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-yellow-500', label: 'Yellow' },
    { value: 'bg-gray-500', label: 'Gray' },
  ];

  if (adminLoading) {
    return <div className="text-center py-8">Checking permissions...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Access Denied</h3>
          <p className="text-muted-foreground mt-2">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Products ({products.length})</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information' : 'Create a new product for your store'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laptops">Laptops</SelectItem>
                      <SelectItem value="desktops">Desktops</SelectItem>
                      <SelectItem value="phones">Phones</SelectItem>
                      <SelectItem value="refurbished phones">Refurbished Phones</SelectItem>
                      <SelectItem value="printers">Printers</SelectItem>
                      <SelectItem value="tablets">Tablets</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="components">Components</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="peripherals">Peripherals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (KES) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price (KES)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product Images</Label>
                <div className="flex flex-col space-y-4">
                  {previewImages.length > 0 && (
                    <div className="relative">
                      <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={previewImages[currentImageIndex]}
                          alt={`Preview ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {previewImages.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                          {previewImages.map((_, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-3 h-3 rounded-full ${currentImageIndex === index ? 'bg-primary' : 'bg-gray-300'}`}
                              aria-label={`Go to slide ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(currentImageIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center space-y-2 p-4 border-2 border-dashed rounded-lg hover:bg-gray-50">
                          <Plus className="h-6 w-6 text-gray-400" />
                          <span className="text-sm text-gray-500">Upload Files</span>
                          <span className="text-xs text-gray-400">Select multiple</span>
                        </div>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center space-y-2 p-4 border-2 border-dashed rounded-lg hover:bg-gray-50">
                          <Plus className="h-6 w-6 text-gray-400" />
                          <span className="text-sm text-gray-500">Upload Folder</span>
                          <span className="text-xs text-gray-400">All images in folder</span>
                        </div>
                      </Label>
                      <Input
                        id="folder-upload"
                        type="file"
                        multiple
                        onChange={handleFolderChange}
                        className="hidden"
                        accept="image/*"
                        // @ts-ignore
                        webkitdirectory="true"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="badge">Badge Text</Label>
                  <Input
                    id="badge"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="badge_color">Badge Color</Label>
                  <Select
                    value={formData.badge_color}
                    onValueChange={(value) => setFormData({ ...formData, badge_color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select badge color" />
                    </SelectTrigger>
                    <SelectContent>
                      {badgeColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reviews_count">Reviews Count</Label>
                  <Input
                    id="reviews_count"
                    type="number"
                    min="0"
                    value={formData.reviews_count}
                    onChange={(e) => setFormData({ ...formData, reviews_count: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="in_stock">In Stock</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="in_stock"
                      checked={formData.in_stock}
                      onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.in_stock ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
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
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {product.images && product.images.length > 0 && (
                      <div className="relative w-12 h-12">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                        {product.images.length > 1 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            +{product.images.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.badge && (
                        <Badge className={`${product.badge_color} text-white text-xs`}>
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{product.category}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>KES {product.price.toLocaleString()}</span>
                    {product.original_price && (
                      <span className="text-xs text-muted-foreground line-through">
                        KES {product.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span>{product.rating}</span>
                    <span className="text-muted-foreground">({product.reviews_count})</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.in_stock ? "default" : "destructive"}>
                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(product.id)}
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

      {products.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No products found. Create your first product to get started.
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
