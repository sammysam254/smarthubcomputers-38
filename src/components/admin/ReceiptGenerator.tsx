import React, { useState, useRef } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface ReceiptData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  orderId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  mpesaCode: string;
  deliveredBy: string;
  salesPerson: string;
}

const ReceiptGenerator = () => {
  const { fetchMpesaPayments, fetchOrders, fetchProducts } = useAdmin();
  const [receiptData, setReceiptData] = useState<ReceiptData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    orderId: '',
    itemName: '',
    quantity: 1,
    unitPrice: 0,
    mpesaCode: '',
    deliveredBy: '',
    salesPerson: ''
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [mpesaPayments, setMpesaPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, paymentsData, productsData] = await Promise.all([
          fetchOrders(),
          fetchMpesaPayments(),
          fetchProducts()
        ]);
        setOrders(ordersData || []);
        setMpesaPayments(paymentsData || []);
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Find the product details
      const product = products.find(p => p.id === order.product_id);
      const productName = product ? product.name : 'Product';
      
      setReceiptData(prev => ({
        ...prev,
        orderId: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerEmail: order.customer_email,
        customerAddress: order.shipping_address,
        itemName: productName,
        quantity: order.quantity,
        unitPrice: order.total_amount / order.quantity
      }));

      // Find matching MPesa payment
      const payment = mpesaPayments.find(p => p.order_id === orderId);
      if (payment) {
        setReceiptData(prev => ({
          ...prev,
          mpesaCode: payment.transaction_id || payment.checkout_request_id || ''
        }));
      }
    }
  };

  const calculateSubtotal = () => receiptData.quantity * receiptData.unitPrice;
  const calculateVAT = () => calculateSubtotal() * 0.16;
  const calculateTotal = () => calculateSubtotal() + calculateVAT();

  const handleDownload = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - Order #${receiptData.orderId}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 10px; font-size: 12px; }
                .receipt { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 15px; }
                .logo { max-height: 60px; margin: 0 auto 8px auto; display: block; }
                .company-name { font-size: 20px; font-weight: bold; margin: 5px 0; }
                .contact-info { font-size: 11px; color: #666; }
                .section { margin: 10px 0; }
                .table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
                .table th, .table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                .table th { background-color: #f5f5f5; font-weight: bold; }
                .total-row { font-weight: bold; background-color: #f9f9f9; }
                .signature-section { margin-top: 20px; display: flex; justify-content: space-between; }
                .signature-box { text-align: center; width: 180px; font-size: 10px; }
                .signature-line { border-bottom: 1px solid #000; margin-bottom: 3px; height: 30px; }
                .receipt-title { font-size: 16px; margin: 8px 0; }
                .receipt-info { font-size: 10px; margin: 3px 0; }
                .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .payment-info { margin: 10px 0; font-size: 11px; }
                .footer-text { font-size: 10px; margin-top: 15px; }
                @media print { 
                  body { margin: 0; font-size: 11px; } 
                  .receipt { margin: 0; padding: 10px; }
                  @page { size: A4; margin: 15mm; }
                }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .receipt { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { max-height: 80px; margin-bottom: 10px; }
                .company-name { font-size: 24px; font-weight: bold; margin: 10px 0; }
                .contact-info { font-size: 14px; color: #666; }
                .section { margin: 20px 0; }
                .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                .table th { background-color: #f5f5f5; font-weight: bold; }
                .total-row { font-weight: bold; background-color: #f9f9f9; }
                .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
                .signature-box { text-align: center; width: 200px; }
                .signature-line { border-bottom: 1px solid #000; margin-bottom: 5px; height: 40px; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Receipt Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order-select">Select Order</Label>
              <Select onValueChange={handleOrderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      Order #{order.id.slice(0, 8)} - {order.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mpesa-code">MPesa Code</Label>
              <Input
                id="mpesa-code"
                value={receiptData.mpesaCode}
                onChange={(e) => setReceiptData(prev => ({ ...prev, mpesaCode: e.target.value }))}
                placeholder="MPesa transaction code"
              />
            </div>

            <div>
              <Label htmlFor="delivered-by">Delivered By</Label>
              <Input
                id="delivered-by"
                value={receiptData.deliveredBy}
                onChange={(e) => setReceiptData(prev => ({ ...prev, deliveredBy: e.target.value }))}
                placeholder="Delivery person name"
              />
            </div>

            <div>
              <Label htmlFor="sales-person">Sales Person</Label>
              <Input
                id="sales-person"
                value={receiptData.salesPerson}
                onChange={(e) => setReceiptData(prev => ({ ...prev, salesPerson: e.target.value }))}
                placeholder="Sales person name"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Receipt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Preview */}
      <div ref={receiptRef} className="receipt bg-white p-4 border rounded-lg shadow-lg max-w-4xl mx-auto text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="header text-center mb-4">
          <div className="flex justify-center mb-2">
            <img 
              src="/lovable-uploads/e794c35d-09b9-447c-9ad8-265176240bde.png" 
              alt="SmartHub Computers" 
              className="h-16 w-auto object-contain"
              style={{ maxHeight: '60px', display: 'block', margin: '0 auto' }}
            />
          </div>
          <h1 className="company-name text-xl font-bold mb-1">SmartHub Computers</h1>
          <div className="contact-info text-xs text-gray-600">
            <p>Koinange Street Uniafric House Room 208</p>
            <p>Phone: 0704144239 | Email: support@smarthubcomputers.com</p>
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-lg font-bold">DELIVERY RECEIPT</h2>
          <p className="text-gray-600 text-xs">Receipt #{receiptData.orderId || 'N/A'}</p>
          <p className="text-gray-600 text-xs">Date: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Customer Information */}
        <div className="section mb-4">
          <h3 className="font-bold mb-2 text-sm">Customer Information:</h3>
          <div className="customer-grid">
            <div>
              <p className="text-xs"><strong>Name:</strong> {receiptData.customerName}</p>
              <p className="text-xs"><strong>Phone:</strong> {receiptData.customerPhone}</p>
            </div>
            <div>
              <p className="text-xs"><strong>Email:</strong> {receiptData.customerEmail}</p>
              <p className="text-xs"><strong>Address:</strong> {receiptData.customerAddress}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="table w-full border-collapse mb-4 text-xs">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2 bg-gray-100">Item Name</th>
              <th className="border border-gray-300 p-2 bg-gray-100">Qty</th>
              <th className="border border-gray-300 p-2 bg-gray-100">Unit Price (KSH)</th>
              <th className="border border-gray-300 p-2 bg-gray-100">Total (KSH)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">{receiptData.itemName}</td>
              <td className="border border-gray-300 p-2">{receiptData.quantity}</td>
              <td className="border border-gray-300 p-2">{receiptData.unitPrice.toLocaleString()}</td>
              <td className="border border-gray-300 p-2">{calculateSubtotal().toLocaleString()}</td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-gray-300 p-2 font-bold">Subtotal</td>
              <td className="border border-gray-300 p-2 font-bold">KSH {calculateSubtotal().toLocaleString()}</td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-gray-300 p-2 font-bold">VAT (16%)</td>
              <td className="border border-gray-300 p-2 font-bold">KSH {calculateVAT().toLocaleString()}</td>
            </tr>
            <tr className="total-row bg-gray-100">
              <td colSpan={3} className="border border-gray-300 p-2 font-bold">TOTAL</td>
              <td className="border border-gray-300 p-2 font-bold">KSH {calculateTotal().toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {/* Payment Information */}
        <div className="payment-info mb-4">
          <h3 className="font-bold mb-2 text-sm">Payment Information:</h3>
          <p className="text-xs"><strong>MPesa Transaction Code:</strong> {receiptData.mpesaCode}</p>
          <p className="text-xs"><strong>Payment Status:</strong> Confirmed</p>
        </div>

        {/* Signatures */}
        <div className="signature-section flex justify-between mt-6">
          <div className="signature-box text-center" style={{ width: '180px' }}>
            <div className="signature-line border-b border-black mb-1" style={{ height: '30px' }}></div>
            <p className="font-bold text-xs">Customer Signature</p>
            <p className="text-xs">{receiptData.customerName}</p>
          </div>
          
          <div className="signature-box text-center" style={{ width: '180px' }}>
            <div className="signature-line border-b border-black mb-1" style={{ height: '30px' }}></div>
            <p className="font-bold text-xs">Delivered By</p>
            <p className="text-xs">{receiptData.deliveredBy}</p>
          </div>
          
          <div className="signature-box text-center" style={{ width: '180px' }}>
            <div className="signature-line border-b border-black mb-1" style={{ height: '30px' }}></div>
            <p className="font-bold text-xs">Sales Signature</p>
            <p className="text-xs">{receiptData.salesPerson}</p>
          </div>
        </div>

        <div className="footer-text text-center mt-4 text-xs text-gray-600">
          <p>Thank you for choosing SmartHub Computers!</p>
          <p>For support, contact us at support@smarthubcomputers.com or 0704144239</p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;