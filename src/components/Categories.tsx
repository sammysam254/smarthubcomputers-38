import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Laptop, Monitor, Cpu, Headphones, Keyboard, Mouse, Printer, Smartphone, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    icon: Laptop,
    title: "Laptops",
    description: "High-performance laptops for work and gaming",
    count: "150+ Models",
    gradient: "from-blue-500 to-blue-600",
    category: "laptops"
  },
  {
    icon: Monitor,
    title: "Desktops",
    description: "Custom built and pre-configured desktop PCs",
    count: "200+ Builds",
    gradient: "from-purple-500 to-purple-600",
    category: "desktops"
  },
  {
    icon: Smartphone,
    title: "Phones",
    description: "Latest smartphones and mobile devices",
    count: "80+ Models",
    gradient: "from-teal-500 to-teal-600",
    category: "phones"
  },
  {
    icon: RefreshCcw,
    title: "Refurbished Phones",
    description: "Quality refurbished smartphones at great prices",
    count: "50+ Models",
    gradient: "from-emerald-500 to-emerald-600",
    category: "refurbished-phones"
  },
  {
    icon: Printer,
    title: "Printers",
    description: "Office and home printers for all your needs",
    count: "30+ Models",
    gradient: "from-cyan-500 to-cyan-600",
    category: "printers"
  },
  {
    icon: Cpu,
    title: "Components",
    description: "CPUs, GPUs, RAM, and motherboards",
    count: "500+ Parts",
    gradient: "from-green-500 to-green-600",
    category: "components"
  },
  {
    icon: Headphones,
    title: "Audio",
    description: "Headphones, speakers, and audio equipment",
    count: "100+ Products",
    gradient: "from-orange-500 to-orange-600",
    category: "audio"
  },
  {
    icon: Keyboard,
    title: "Peripherals",
    description: "Keyboards, mice, and gaming accessories",
    count: "300+ Items",
    gradient: "from-red-500 to-red-600",
    category: "peripherals"
  },
  {
    icon: Mouse,
    title: "Gaming",
    description: "Gaming gear and specialized equipment",
    count: "250+ Products",
    gradient: "from-indigo-500 to-indigo-600",
    category: "gaming"
  }
];

const Categories = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find exactly what you need from our comprehensive selection of computer hardware and accessories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border/50 hover:border-primary/30 h-full"
                onClick={() => navigate(`/${category.category}`)}
              >
                <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {category.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {category.description}
                        </p>
                        <p className="text-primary font-medium text-sm">
                          {category.count}
                        </p>
                      </div>

                      <Button 
                        variant="tech" 
                        size="sm" 
                        className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/${category.category}`);
                        }}
                      >
                        Browse {category.title}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;