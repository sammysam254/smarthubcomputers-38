
import { useEffect, useState, lazy, Suspense, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Package, ShoppingCart, MessageSquare, Users, Megaphone, Zap, Ticket, Smartphone, Headphones, CreditCard, Menu, X, ChevronDown, FileText, Monitor, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Lazy load admin components for better performance
const ProductsManager = lazy(() => import('@/components/admin/ProductsManager'));
const OrdersManager = lazy(() => import('@/components/admin/OrdersManager'));
const MessagesManager = lazy(() => import('@/components/admin/MessagesManager'));
const UsersManager = lazy(() => import('@/components/admin/UsersManager'));
const PromotionsManager = lazy(() => import('@/components/admin/PromotionsManager'));
const FlashSalesManager = lazy(() => import('@/components/admin/FlashSalesManager'));
const VouchersManager = lazy(() => import('@/components/admin/VouchersManager'));
const MpesaPaymentsManager = lazy(() => import('@/components/admin/MpesaPaymentsManager'));
const MpesaConfirmationManager = lazy(() => import('@/components/admin/MpesaConfirmationManager'));
const NcbaLoopPaymentsManager = lazy(() => import('@/components/admin/NcbaLoopPaymentsManager'));
const SupportTicketsManager = lazy(() => import('@/components/admin/SupportTicketsManager'));
const ReceiptGenerator = lazy(() => import('@/components/admin/ReceiptGenerator'));
const AdsManager = lazy(() => import('@/components/admin/AdsManager'));
import { toast } from 'sonner';

// Optimized loading component
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2 text-muted-foreground">Loading...</span>
  </div>
));

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  const tabOptions = [
    { value: "products", label: "Products", icon: Package },
    { value: "orders", label: "Orders", icon: ShoppingCart },
    { value: "receipts", label: "Receipts", icon: FileText },
    { value: "flash-sales", label: "Flash Sales", icon: Zap },
    { value: "vouchers", label: "Vouchers", icon: Ticket },
    { value: "mpesa", label: "M-Pesa", icon: Smartphone },
    { value: "mpesa-confirmations", label: "M-Pesa Confirm", icon: Smartphone },
    { value: "ncba-loop", label: "NCBA Loop", icon: CreditCard },
    { value: "messages", label: "Messages", icon: MessageSquare },
    { value: "users", label: "Users", icon: Users },
    { value: "promotions", label: "Promotions", icon: Megaphone },
    { value: "ads", label: "Ads", icon: Monitor },
    { value: "support", label: "Support", icon: Headphones },
  ];

  const getActiveTabLabel = () => {
    const activeTabOption = tabOptions.find(tab => tab.value === activeTab);
    return activeTabOption ? activeTabOption.label : "Select Section";
  };

  useEffect(() => {
    // If not loading and either no user or not admin, redirect to auth
    if (!loading) {
      if (!user) {
        toast.error('You must be logged in to access the admin panel');
        navigate('/auth');
        return;
      }
      
      if (!isAdmin) {
        toast.error('You do not have admin privileges');
        navigate('/');
        return;
      }
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Failed to sign out');
      } else {
        toast.success('Signed out successfully');
        navigate('/');
      }
    } catch (error) {
      toast.error('Failed to sign out');
    }
  }, [signOut, navigate]);

  // Show optimized loading state while checking admin status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not admin (redirect will happen via useEffect)
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - SmartHub Computers</title>
        <meta name="description" content="Admin dashboard for managing SmartHub Computers store. Manage products, orders, users and more." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://smarthubcomputers.com/admin" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/e794c35d-09b9-447c-9ad8-265176240bde.png" 
                alt="SmartHub Computers" 
                className="h-10 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">SmartHub Computers Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="hidden md:inline text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigate('/')} className="hidden sm:flex">
                View Site
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden sm:flex">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              
              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm sm:hidden">
          <div className="fixed inset-y-0 left-0 w-64 bg-background border-r p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Admin Menu</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Welcome, {user.email}</p>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => {
                  navigate('/');
                  setMobileMenuOpen(false);
                }}
              >
                View Site
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          
          <div 
            className="flex-1" 
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Dropdown Menu for Tab Selection */}
          <div className="flex justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-48 justify-between">
                  <span className="flex items-center space-x-2">
                    {(() => {
                      const ActiveIcon = tabOptions.find(tab => tab.value === activeTab)?.icon || Package;
                      return <ActiveIcon className="h-4 w-4" />;
                    })()}
                    <span>{getActiveTabLabel()}</span>
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-48 max-h-80 overflow-y-auto bg-background border shadow-lg">
                {tabOptions.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <DropdownMenuItem
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-muted ${
                        activeTab === tab.value ? 'bg-muted text-primary' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Products Management</CardTitle>
                <CardDescription>
                  Add, edit, and delete products in your store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<LoadingSpinner />}>
                  <ProductsManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders Management</CardTitle>
                <CardDescription>
                  View and manage customer orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <OrdersManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts">
            <Card>
              <CardHeader>
                <CardTitle>Receipt Generator</CardTitle>
                <CardDescription>
                  Generate delivery receipts for customers with MPesa confirmation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <ReceiptGenerator />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flash-sales">
            <Card>
              <CardHeader>
                <CardTitle>Flash Sales Management</CardTitle>
                <CardDescription>
                  Create and manage limited-time flash sales with special discounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <FlashSalesManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vouchers">
            <Card>
              <CardHeader>
                <CardTitle>Voucher Management</CardTitle>
                <CardDescription>
                  Create and manage discount vouchers for customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <VouchersManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mpesa">
            <Card>
              <CardHeader>
                <CardTitle>M-Pesa Payment History</CardTitle>
                <CardDescription>
                  View M-Pesa payment transactions and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <MpesaPaymentsManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mpesa-confirmations">
            <Card>
              <CardHeader>
                <CardTitle>M-Pesa Manual Confirmations</CardTitle>
                <CardDescription>
                  Manually confirm or reject M-Pesa payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <MpesaConfirmationManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ncba-loop">
            <Card>
              <CardHeader>
                <CardTitle>NCBA Loop Payment Management</CardTitle>
                <CardDescription>
                  Review and confirm NCBA Loop paybill payments from customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <NcbaLoopPaymentsManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Customer Messages</CardTitle>
                <CardDescription>
                  View and respond to customer inquiries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <MessagesManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>
                  Manage user accounts and admin permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <UsersManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotions">
            <Card>
              <CardHeader>
                <CardTitle>Promotional Content</CardTitle>
                <CardDescription>
                  Create and manage promotional banners and campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <PromotionsManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads">
            <Card>
              <CardHeader>
                <CardTitle>Ads Management</CardTitle>
                <CardDescription>
                  Create and manage advertisements displayed on the homepage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <AdsManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>
                  Manage customer support tickets and respond to inquiries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <SupportTicketsManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </>
  );
};

export default Admin;
