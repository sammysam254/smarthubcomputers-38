import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Check for existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribeToNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID public key - using a default for now, should be from environment
      const publicKey = 'BKr9hflKMHTnI1Kh7t_rNrWlVi7h-zMjrWrqGbJh3CsM6GJA5rq8xWmxZ7YFQJVH8aP2QxRz6mKjNhT9rXsVzA8';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      setSubscription(subscription);

      // Send subscription to backend
      await supabase.functions.invoke('subscribe-notifications', {
        body: { subscription }
      });

      return subscription;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  };

  const unsubscribeFromNotifications = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);

        // Remove subscription from backend
        await supabase.functions.invoke('unsubscribe-notifications', {
          body: { endpoint: subscription.endpoint }
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      throw error;
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToNotifications,
    unsubscribeFromNotifications
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}