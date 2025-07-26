
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface FeedbackFormProps {
  orderId: string;
  productId: string;
  productName: string;
  onSuccess?: () => void;
}

const FeedbackForm = ({ orderId, productId, productName, onSuccess }: FeedbackFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [shippingRating, setShippingRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hoveredShippingRating, setHoveredShippingRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to submit feedback');
      return;
    }

    if (rating === 0) {
      toast.error('Please provide a product rating');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          order_id: orderId,
          product_id: productId,
          rating,
          shipping_rating: shippingRating || null,
          review_text: reviewText.trim() || null
        });

      if (error) {
        throw error;
      }

      toast.success('Thank you for your feedback!');
      
      // Reset form
      setRating(0);
      setShippingRating(0);
      setReviewText('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      if (error.message?.includes('duplicate key')) {
        toast.error('You have already provided feedback for this product');
      } else {
        toast.error('Failed to submit feedback. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ 
    currentRating, 
    onRate, 
    hoveredRating, 
    onHover, 
    onLeave,
    label 
  }: {
    currentRating: number;
    onRate: (rating: number) => void;
    hoveredRating: number;
    onHover: (rating: number) => void;
    onLeave: () => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={onLeave}
            className="p-1 rounded transition-colors hover:bg-accent"
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hoveredRating || currentRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rate & Review: {productName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Rating */}
          <StarRating
            label="Product Rating *"
            currentRating={rating}
            onRate={setRating}
            hoveredRating={hoveredRating}
            onHover={setHoveredRating}
            onLeave={() => setHoveredRating(0)}
          />

          {/* Shipping Rating */}
          <StarRating
            label="Shipping Speed Rating"
            currentRating={shippingRating}
            onRate={setShippingRating}
            hoveredRating={hoveredShippingRating}
            onHover={setHoveredShippingRating}
            onLeave={() => setHoveredShippingRating(0)}
          />

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Your Review (Optional)</Label>
            <Textarea
              id="review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading || rating === 0}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
