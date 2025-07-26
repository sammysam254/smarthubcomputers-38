
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Package, ShoppingCart, MessageSquare, Users, Megaphone, Zap, Ticket, Smartphone, Headphones, CreditCard, Menu, X, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ProductsManager from '@/components/admin/ProductsManager';
import OrdersManager from '@/components/admin/OrdersManager';
import MessagesManager from '@/components/admin/MessagesManager';
import UsersManager from '@/components/admin/UsersManager';
import PromotionsManager from '@/components/admin/PromotionsManager';
import FlashSalesManager from '@/components/admin/FlashSalesManager';
import VouchersManager from '@/components/admin/VouchersManager';
import MpesaPaymentsManager from '@/components/admin/MpesaPaymentsManager';
import MpesaConfirmationManager from '@/components/admin/MpesaConfirmationManager';
import NcbaLoopPaymentsManager from '@/components/admin/NcbaLoopPaymentsManager';
import SupportTicketsManager from '@/components/admin/SupportTicketsManager';
import { toast } from 'sonner';

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  const tabOptions = [
    { value: "products", label: "Products", icon: Package },
    { value: "orders", label: "Orders", icon: ShoppingCart },
    { value: "flash-sales", label: "Flash Sales", icon: Zap },
    { value: "vouchers", label: "Vouchers", icon: Ticket },
    { value: "mpesa", label: "M-Pesa", icon: Smartphone },
    { value: "mpesa-confirmations", label: "M-Pesa Confirm", icon: Smartphone },
    { value: "ncba-loop", label: "NCBA Loop", icon: CreditCard },
    { value: "messages", label: "Messages", icon: MessageSquare },
    { value: "users", label: "Users", icon: Users },
    { value: "promotions", label: "Promotions", icon: Megaphone },
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

  const handleSignOut = async () => {
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
  };

  // Show loading state while checking admin status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
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
                <ProductsManager />
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
                <OrdersManager />
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
                <FlashSalesManager />
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
                <VouchersManager />
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
                <MpesaPaymentsManager />
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
                <MpesaConfirmationManager />
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
                <NcbaLoopPaymentsManager />
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
                <MessagesManager />
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
                <UsersManager />
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
                <PromotionsManager />
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
                <SupportTicketsManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
