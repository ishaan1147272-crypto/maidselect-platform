import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Trash2, ShoppingCart, ArrowLeft, Minus, Plus } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = 'rzp_live_SbPnrrGOpvRt3g';

const Cart = () => {
  const { items, removeItem, updateHours, clearCart, subtotal, platformFee, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePayment = () => {
    if (!user) {
      toast.error('Please sign in to proceed');
      navigate('/auth');
      return;
    }
    if (items.length === 0) return;

    const options = {
      key: RAZORPAY_KEY,
      amount: total * 100, // paise
      currency: 'INR',
      name: 'MaidSelect',
      description: `Booking for ${items.length} professional(s)`,
      handler: async (response: any) => {
        try {
          const scheduledDate = new Date().toISOString();
          const bookings = items.map(item => ({
            customer_id: user.id,
            maid_id: item.id,
            scheduled_date: scheduledDate,
            status: 'confirmed',
            total_hours: item.hours,
            total_amount: item.hourly_rate * item.hours,
            platform_fee: Math.round(item.hourly_rate * item.hours * 0.1),
            payment_id: response.razorpay_payment_id,
            payment_status: 'paid',
          }));

          const { error } = await supabase.from('bookings').insert(bookings);
          if (error) throw error;

          clearCart();
          navigate('/booking-success');
        } catch (e: any) {
          toast.error('Booking failed: ' + e.message);
        }
      },
      prefill: { email: user.email },
      theme: { color: '#16a34a' },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center space-y-4">
        <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30" />
        <h2 className="text-xl font-heading font-semibold text-muted-foreground">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground">Browse our professionals and add them to your cart.</p>
        <Button onClick={() => navigate('/')}>Browse Professionals</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back
      </Button>
      <h1 className="text-2xl font-heading font-bold">Your Cart</h1>

      <div className="space-y-3">
        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <img
                src={item.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=80&background=2d9d78&color=fff`}
                alt={item.name}
                className="h-14 w-14 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{item.name}</h3>
                {item.city && <p className="text-xs text-muted-foreground">{item.city}</p>}
                <p className="text-xs text-muted-foreground">₹{item.hourly_rate}/hr</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateHours(item.id, item.hours - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={item.hours}
                  onChange={e => updateHours(item.id, parseInt(e.target.value) || 1)}
                  className="w-14 h-7 text-center text-sm"
                />
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateHours(item.id, item.hours + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-semibold text-sm w-20 text-right">₹{item.hourly_rate * item.hours}</p>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform Fee (10%)</span>
            <span>₹{platformFee}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">₹{total}</span>
          </div>
          <Button className="w-full" size="lg" onClick={handlePayment}>
            Proceed to Pay ₹{total}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cart;
