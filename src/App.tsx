
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import FlashSales from "./pages/FlashSales";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";
import LiveChat from "./components/LiveChat";
import WhatsAppChat from "./components/WhatsAppChat";
import { NotificationPermission } from "./components/NotificationPermission";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="/laptops" element={<Products />} />
                  <Route path="/desktops" element={<Products />} />
                  <Route path="/components" element={<Products />} />
                  <Route path="/peripherals" element={<Products />} />
                  <Route path="/gaming" element={<Products />} />
                  <Route path="/audio" element={<Products />} />
                  <Route path="/printers" element={<Products />} />
                  <Route path="/phones" element={<Products />} />
                  <Route path="/refurbished-phones" element={<Products />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/flash-sales" element={<FlashSales />} />
                  <Route path="/my-orders" element={<MyOrders />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <LiveChat />
                <WhatsAppChat />
                <NotificationPermission />
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
