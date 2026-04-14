import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, ShoppingCart, ArrowLeft, Minus, Plus, Tag } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SbPnrrGOpvRt3g';

const Cart = () => {
  const { items, removeItem, updateHours, clearCart, subtotal, platformFee, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is a first-time customer (0 confirmed bookings)
  const { data: bookingCount } = useQuery({
    queryKey: ['user-booking-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id)
        .eq('status', 'confirmed');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const isFirstTime = user && bookingCount === 0;
  const discountPercent = isFirstTime ? 20 : 0;
  const discountAmount = Math.round(subtotal * discountPercent / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const adjustedPlatformFee = Math.round(discountedSubtotal * 0.1);
  const grandTotal = discountedSubtotal + adjustedPlatformFee;

  const handlePayment = () => {
    if (!user) {
      toast.error('Please sign in to proceed');
      navigate('/auth');
      return;
    }
    if (items.length === 0) return;

    const options = {
      key: RAZORPAY_KEY,
      amount: grandTotal * 100,
      currency: 'INR',
      name: 'MaidSelect',
      description: `Booking for ${items.length} professional(s)`,
      handler: async (response: any) => {
        try {
          const scheduledDate = new Date().toISOString();
          const bookings = items.map(item => {
            const itemTotal = item.hourly_rate * item.hours;
            const itemDiscount = Math.round(itemTotal * discountPercent / 100);
            const itemFinal = itemTotal - itemDiscount;
            return {
              customer_id: user.id,
              maid_id: item.id,
              scheduled_date: scheduledDate,
              status: 'confirmed',
              total_hours: item.hours,
              total_amount: itemFinal,
              platform_fee: Math.round(itemFinal * 0.1),
              payment_id: response.razorpay_payment_id,
              payment_status: 'paid',
            };
          });

          const { error } = await supabase.from('bookings').insert(bookings);
          if (error) throw error;

          // Pass maid IDs to success page
          const maidIds = items.map(i => i.id).join(',');
          clearCart();
          navigate(`/booking-success?maids=${maidIds}`);
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

      {isFirstTime && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <Tag className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">FIRST20 — 20% Off Your First Booking!</p>
            <p className="text-xs text-muted-foreground">Applied automatically for new customers.</p>
          </div>
        </div>
      )}

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
            <span className={isFirstTime ? 'line-through text-muted-foreground' : ''}>₹{subtotal}</span>
          </div>
          {isFirstTime && (
            <div className="flex justify-between text-sm">
              <span className="text-primary font-medium flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px]">FIRST20</Badge> Discount (20%)
              </span>
              <span className="text-primary font-medium">-₹{discountAmount}</span>
            </div>
          )}
          {isFirstTime && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discounted Subtotal</span>
              <span>₹{discountedSubtotal}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform Fee (10%)</span>
            <span>₹{isFirstTime ? adjustedPlatformFee : platformFee}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Grand Total</span>
            <span className="text-primary">₹{grandTotal}</span>
          </div>
          <Button className="w-full" size="lg" onClick={handlePayment}>
            Proceed to Pay ₹{grandTotal}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cart;
