import { Button } from '@/components/ui/button';

const WhatsAppChat = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = '254704144239'; // International format of 0704144239
    const message = encodeURIComponent('Hi! I\'m interested in your computers and tech products from SmartHub Computers. Can you help me with product information, pricing, and availability?');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Button
        onClick={handleWhatsAppClick}
        className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
        size="icon"
      >
        <img 
          src="/lovable-uploads/b2e5c873-abbc-46f8-a663-eb79c2fb5a8c.png" 
          alt="WhatsApp" 
          className="h-8 w-8" 
        />
      </Button>
    </div>
  );
};

export default WhatsAppChat;