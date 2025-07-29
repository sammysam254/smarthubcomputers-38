import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Set proper 404 status code for SEO
    const currentResponse = window.history?.state?.response;
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(
        { ...window.history.state, statusCode: 404 }, 
        '', 
        location.pathname
      );
    }
    
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Page Not Found - SmartHub Computers Kenya</title>
        <meta name="description" content="The page you're looking for doesn't exist. Browse our collection of laptops, desktops, and computer accessories at SmartHub Computers Kenya." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://smarthubcomputers.com/404" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
              <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/">
                  <Button className="w-full sm:w-auto">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Homepage
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Products
                  </Button>
                </Link>
              </div>
              
              <Button variant="ghost" onClick={() => window.history.back()} className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
            
            {/* Helpful links for SEO */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-medium mb-3">Popular Categories</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Link to="/laptops" className="text-primary hover:underline">Laptops</Link>
                <Link to="/desktops" className="text-primary hover:underline">Desktop Computers</Link>
                <Link to="/gaming" className="text-primary hover:underline">Gaming PCs</Link>
                <Link to="/peripherals" className="text-primary hover:underline">Computer Accessories</Link>
                <Link to="/components" className="text-primary hover:underline">PC Components</Link>
                <Link to="/flash-sales" className="text-primary hover:underline">Flash Sales</Link>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default NotFound;
