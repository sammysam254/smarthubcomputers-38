import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Laptop, Monitor, Cpu, Headphones, Gamepad2, Smartphone, Printer, ShoppingBag, Zap } from 'lucide-react';

const InternalLinksSection = () => {
  const categoryLinks = [
    {
      to: '/laptops',
      title: 'Premium Gaming Laptops Kenya',
      description: 'High-performance laptops for gaming and professional work',
      icon: Laptop,
      keywords: 'gaming laptops, business laptops, portable computers'
    },
    {
      to: '/desktops',
      title: 'Custom Desktop Computers',
      description: 'Powerful desktop PCs for office and gaming',
      icon: Monitor,
      keywords: 'desktop PCs, workstations, custom computers'
    },
    {
      to: '/components',
      title: 'Computer Hardware & Components',
      description: 'CPUs, GPUs, RAM, motherboards and storage drives',
      icon: Cpu,
      keywords: 'computer parts, PC components, hardware upgrades'
    },
    {
      to: '/gaming',
      title: 'Professional Gaming Equipment',
      description: 'Gaming PCs, peripherals and accessories',
      icon: Gamepad2,
      keywords: 'gaming gear, esports equipment, gaming accessories'
    },
    {
      to: '/peripherals',
      title: 'Computer Accessories & Devices',
      description: 'Keyboards, mice, monitors, webcams and more',
      icon: ShoppingBag,
      keywords: 'computer accessories, input devices, monitors'
    },
    {
      to: '/phones',
      title: 'Latest Smartphones & Mobile Technology',
      description: 'Android phones, iPhones and mobile accessories',
      icon: Smartphone,
      keywords: 'smartphones, mobile phones, phone accessories'
    },
    {
      to: '/audio',
      title: 'Audio Equipment & Sound Systems',
      description: 'Speakers, headphones, microphones and audio gear',
      icon: Headphones,
      keywords: 'audio equipment, sound systems, headphones'
    },
    {
      to: '/printers',
      title: 'Office Printers & Scanning Solutions',
      description: 'Inkjet, laser printers and multifunction devices',
      icon: Printer,
      keywords: 'office printers, scanners, printing solutions'
    },
    {
      to: '/flash-sales',
      title: 'Flash Sales & Limited Time Offers',
      description: 'Amazing deals with huge discounts on tech products',
      icon: Zap,
      keywords: 'flash sales, computer deals, tech discounts'
    }
  ];

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Explore Our Complete Product Range</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover Kenya's most comprehensive selection of computers, laptops, and technology accessories
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryLinks.map((category) => {
            const Icon = category.icon;
            
            return (
              <Link key={category.to} to={category.to} className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {category.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-sm mb-3">
                      {category.description}
                    </p>
                    <p className="text-xs text-muted-foreground/80 italic">
                      {category.keywords}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        
        <div className="text-center mt-8">
          <Link to="/products" className="inline-flex items-center text-primary hover:underline font-medium">
            View All Products & Categories →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default InternalLinksSection;