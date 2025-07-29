import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const SEOBreadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(segment => segment);

  const breadcrumbMap: { [key: string]: string } = {
    'products': 'All Products',
    'laptops': 'Premium Laptops',
    'desktops': 'Desktop Computers',
    'components': 'PC Components',
    'peripherals': 'Computer Accessories',
    'gaming': 'Gaming Equipment',
    'audio': 'Audio Equipment',
    'printers': 'Printers & Scanners',
    'phones': 'Smartphones',
    'refurbished-phones': 'Refurbished Phones',
    'flash-sales': 'Flash Sales & Deals',
    'cart': 'Shopping Cart',
    'auth': 'Login & Registration',
    'my-orders': 'Order History',
    'admin': 'Admin Panel'
  };

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        <li>
          <Link 
            to="/" 
            className="flex items-center hover:text-primary transition-colors"
            title="SmartHub Computers Homepage - Computer Store Kenya"
          >
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
        </li>
        
        {pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const label = breadcrumbMap[segment] || segment;
          const isLast = index === pathSegments.length - 1;
          
          return (
            <li key={segment} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1" />
              {isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link 
                  to={path} 
                  className="hover:text-primary transition-colors"
                  title={`Browse ${label} at SmartHub Computers`}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default SEOBreadcrumbs;