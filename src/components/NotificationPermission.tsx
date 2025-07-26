import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

export const NotificationPermission = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { isSupported, permission, subscription, requestPermission, subscribeToNotifications, unsubscribeFromNotifications } = useNotifications();
  const { toast } = useToast();

  if (!isSupported || !isVisible) {
    return null;
  }

  const handleEnableNotifications = async () => {
    console.log('Enable notifications button clicked');
    
    // Show immediate feedback
    toast({
      title: "Enabling notifications...",
      description: "Please allow permissions when prompted.",
    });

    try {
      console.log('Requesting permission...');
      const granted = await requestPermission();
      console.log('Permission result:', granted);
      
      if (granted) {
        // Show success immediately, then subscribe in background
        toast({
          title: "Notifications enabled!",
          description: "You'll receive updates about new products and offers.",
        });
        setIsVisible(false);
        
        // Subscribe in background without blocking UI
        subscribeToNotifications().catch(console.error);
      } else {
        toast({
          title: "Permission denied",
          description: "You can enable notifications later in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleNotifications = async () => {
    try {
      if (subscription) {
        await unsubscribeFromNotifications();
        toast({
          title: "Notifications disabled",
          description: "You won't receive product updates anymore.",
        });
      } else {
        await subscribeToNotifications();
        toast({
          title: "Notifications enabled!",
          description: "You'll receive updates about new products and offers.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    }
  };

  if (permission === 'granted' && subscription) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notifications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-green-600" />
                <span className="text-sm">Enabled</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleNotifications}
              >
                <BellOff className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Get Product Updates</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Receive notifications about new products and special offers, even when not on the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={handleEnableNotifications}
              className="flex-1"
              size="sm"
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};