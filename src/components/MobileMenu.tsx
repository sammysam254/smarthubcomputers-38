
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Home, Package, Zap, User, Package2, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { user, signOut } = useAuth();

  const menuItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/flash-sales', label: 'Flash Sales', icon: Zap },
    ...(user ? [{ href: '/my-orders', label: 'My Orders', icon: Package2 }] : []),
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Failed to sign out. Please try again.');
      } else {
        toast.success('Signed out successfully');
        onClose();
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/e794c35d-09b9-447c-9ad8-265176240bde.png" 
              alt="SmartHub Computers" 
              className="h-8 w-auto"
            />
            <span>SmartHub Computers</span>
          </SheetTitle>
        </SheetHeader>
        
        {/* Navigation Menu */}
        <nav className="flex flex-col space-y-2 mt-8 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User Section */}
        <div className="border-t pt-4 mt-4">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <User className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/auth" onClick={onClose}>
              <Button className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
