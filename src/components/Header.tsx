
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Menu, User, Package } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import MobileMenu from './MobileMenu';
import AdminLink from './AdminLink';
import { toast } from 'sonner';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);


  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/e794c35d-09b9-447c-9ad8-265176240bde.png" 
              alt="SmartHub Computers" 
              className="h-10 w-auto"
            />
            <span className="font-bold text-xl hidden sm:block">SmartHub Computers</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
              Computer Store Homepage
            </Link>
            <div className="relative group">
              <Link to="/products" className="text-foreground hover:text-primary transition-colors font-medium">
                Browse All Products
              </Link>
              <div className="absolute top-full left-0 mt-2 w-48 bg-background border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2 space-y-1">
                  <Link to="/laptops" className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded">Premium Laptops</Link>
                  <Link to="/desktops" className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded">Desktop Computers</Link>
                  <Link to="/gaming" className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded">Gaming Equipment</Link>
                  <Link to="/components" className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded">PC Components</Link>
                  <Link to="/peripherals" className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded">Computer Accessories</Link>
                  <Link to="/phones" className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded">Smartphones</Link>
                </div>
              </div>
            </div>
            <Link to="/flash-sales" className="text-foreground hover:text-primary transition-colors font-medium">
              Limited Time Deals
            </Link>
            {user && (
              <Link to="/my-orders" className="text-foreground hover:text-primary transition-colors flex items-center space-x-1 font-medium">
                <Package className="h-4 w-4" />
                <span>Order History</span>
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Actions */}
            {user ? (
              <AdminLink />
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </header>
  );
};

export default Header;
