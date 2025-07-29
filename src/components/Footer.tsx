
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const handleQuickLinkClick = (link: string) => {
    switch (link) {
      case "Laptops":
        navigate('/laptops');
        break;
      case "Desktops":
        navigate('/desktops');
        break;
      case "Components":
        navigate('/components');
        break;
      case "Gaming":
        navigate('/gaming');
        break;
      case "Accessories":
        navigate('/peripherals');
        break;
      case "Support":
        window.location.href = "mailto:support@smarthubcomputers.com";
        break;
      default:
        navigate('/products');
    }
  };

  const handleCustomerServiceClick = (link: string) => {
    switch (link) {
      case "Contact Us":
        window.location.href = "mailto:support@smarthubcomputers.com";
        break;
      case "Shipping Info":
        // Create a page or modal with shipping information
        alert("Shipping Information:\nFree delivery within Nairobi CBD\nCountrywide delivery: 1-3 business days\nExpress delivery available");
        break;
      case "Returns":
        alert("Returns Policy:\n30-day return policy\nItems must be in original condition\nContact support@smarthubcomputers.com for returns");
        break;
      case "Warranty":
        alert("Warranty Information:\nManufacturer warranty on all products\nExtended warranty options available\nContact us for warranty claims");
        break;
      case "FAQ":
        alert("Frequently Asked Questions:\nPayment methods: M-Pesa, NCBA Loop, Cash\nDelivery time: 1-3 business days\nContact support for more help");
        break;
      case "Live Chat":
        // The live chat is already visible on all pages
        break;
      default:
        break;
    }
  };

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/e794c35d-09b9-447c-9ad8-265176240bde.png" 
                alt="SmartHub Computers" 
                className="h-8 w-auto"
              />
            </div>
            <p className="text-background/80 text-sm">
              Your trusted partner for premium computers, laptops, and tech solutions. 
              Quality products, expert service, competitive prices.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="text-background/80 hover:text-background hover:bg-background/10">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background/80 hover:text-background hover:bg-background/10">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background/80 hover:text-background hover:bg-background/10">
                <Instagram className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Product Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Product Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/laptops" className="text-background/80 hover:text-background transition-colors text-sm">
                  Premium Gaming Laptops
                </Link>
              </li>
              <li>
                <Link to="/desktops" className="text-background/80 hover:text-background transition-colors text-sm">
                  Custom Desktop PCs
                </Link>
              </li>
              <li>
                <Link to="/components" className="text-background/80 hover:text-background transition-colors text-sm">
                  Computer Hardware Components
                </Link>
              </li>
              <li>
                <Link to="/gaming" className="text-background/80 hover:text-background transition-colors text-sm">
                  Professional Gaming Equipment
                </Link>
              </li>
              <li>
                <Link to="/peripherals" className="text-background/80 hover:text-background transition-colors text-sm">
                  Computer Accessories & Devices
                </Link>
              </li>
              <li>
                <Link to="/phones" className="text-background/80 hover:text-background transition-colors text-sm">
                  Latest Smartphones & Mobile Devices
                </Link>
              </li>
            </ul>
          </div>

          {/* Shopping & Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Shopping & Services</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/flash-sales" className="text-background/80 hover:text-background transition-colors text-sm">
                  Flash Sales & Special Offers
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-background/80 hover:text-background transition-colors text-sm">
                  Shopping Cart & Checkout
                </Link>
              </li>
              <li>
                <Link to="/my-orders" className="text-background/80 hover:text-background transition-colors text-sm">
                  Track Your Orders
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-background/80 hover:text-background transition-colors text-sm">
                  Customer Login & Registration
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => handleCustomerServiceClick("Contact Us")}
                  className="text-background/80 hover:text-background transition-colors text-sm text-left"
                >
                  Expert Technical Support
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCustomerServiceClick("Warranty")}
                  className="text-background/80 hover:text-background transition-colors text-sm text-left"
                >
                  Warranty & Repair Services
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Stay Connected</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-background/80">
                <Phone className="h-4 w-4" />
                <span>0704144239</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-background/80">
                <Mail className="h-4 w-4" />
                <span>support@smarthubcomputers.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-background/80">
                <MapPin className="h-4 w-4" />
                <span>Koinange Street Uniafric House Room 208</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-background/80">Subscribe for deals & updates</p>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Enter email" 
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/60"
                />
                <Button variant="secondary" size="sm">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center">
          <p className="text-background/60 text-sm">
            © 2025 SmartHub Computers. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
        
        {/* Moving Developer Credit */}
        <div className="overflow-hidden bg-background/5 mt-4 py-2">
          <div className="animate-scroll whitespace-nowrap text-green-400 text-xs">
            <span className="inline-block px-4">
              designed and developed by sam, for website developments and designs contact me at sammdev.ai@gmail.com, cell 0706499848
            </span>
            <span className="inline-block px-4">
              designed and developed by sam, for website developments and designs contact me at sammdev.ai@gmail.com, cell 0706499848
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
