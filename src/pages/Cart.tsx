import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Minus, Plus, Trash2, Lock, ShieldCheck, BadgeCheck, ShoppingCart, Tag } from 'lucide-react';
import { formatINR } from '@/lib/pricing';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SbPnrrGOpvRt3g';

const planLabels = {
  hourly: 'Hourly Plan',
  weekly: 'Weekly Plan',
  monthly: 'Monthly Plan',
} as const;

const planUnit = {
  hourly: 'hr',
  weekly: 'wk',
  monthly: 'mo',
} as const;

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, subtotal, platformFee, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

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
  const totalSavings = discountAmount;

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
      description: items.map(i => `${i.name} (${planLabels[i.planType]})`).join(', ').slice(0, 250),
      handler: async (response: any) => {
        try {
          const scheduledDate = new Date().toISOString();
          const bookings = items.map(item => {
            const itemTotal = item.planPrice * item.quantity;
            const itemDiscount = Math.round(itemTotal * discountPercent / 100);
            const itemFinal = itemTotal - itemDiscount;
            return {
              customer_id: user.id,
              maid_id: item.id,
              scheduled_date: scheduledDate,
              status: 'confirmed',
              total_hours: item.quantity,
              total_amount: itemFinal,
              platform_fee: Math.round(itemFinal * 0.1),
              payment_id: response.razorpay_payment_id,
              payment_status: 'paid',
            };
          });

          const { error } = await supabase.from('bookings').insert(bookings);
          if (error) throw error;

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
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
          <ShoppingCart className="h-9 w-9 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-heading font-semibold text-foreground">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground max-w-[260px]">Browse our verified professionals and add them to your cart.</p>
        <Button onClick={() => navigate('/')} className="mt-2 rounded-xl px-8">Browse Professionals</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Compact Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/60">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5 text-foreground" />
          </button>
          <h1 className="text-lg font-heading font-bold text-foreground">Cart</h1>
          <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
            {items.length} item{items.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-[200px]">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

          {/* First-time discount banner */}
          {isFirstTime && (
            <div className="flex items-center gap-3 rounded-2xl bg-primary/8 border border-primary/20 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">FIRST20 — 20% Off Applied!</p>
                <p className="text-xs text-muted-foreground">Welcome discount for new customers.</p>
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div className="space-y-3">
            {items.map(item => {
              const lineTotal = item.planPrice * item.quantity;
              return (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-4 shadow-sm"
                >
                  <img
                    src={item.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=80&background=2d9d78&color=fff`}
                    alt={item.name}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/15 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-[15px] text-foreground truncate">{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {planLabels[item.planType]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatINR(item.planPrice)}/{planUnit[item.planType]}
                      {item.city && ` · ${item.city}`}
                    </p>
                  </div>

                  <div className="flex items-center bg-muted/70 rounded-full h-9 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5 text-foreground" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-foreground" />
                    </button>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-heading font-bold text-sm text-foreground">{formatINR(lineTotal)}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-destructive/60 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-heading font-semibold text-foreground">Price Details</h3>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className={isFirstTime ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}>{formatINR(subtotal)}</span>
            </div>

            {isFirstTime && (
              <div className="flex justify-between text-sm">
                <span className="text-primary font-medium">Discount (20%)</span>
                <span className="text-primary font-medium">−{formatINR(discountAmount)}</span>
              </div>
            )}

            {isFirstTime && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">After Discount</span>
                <span className="text-foreground font-medium">{formatINR(discountedSubtotal)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee (10%)</span>
              <span className="text-foreground font-medium">{formatINR(isFirstTime ? adjustedPlatformFee : platformFee)}</span>
            </div>

            <div className="h-px bg-border/80 my-1" />

            <div className="flex justify-between items-center">
              <span className="font-heading font-bold text-base text-foreground">Grand Total</span>
              <span className="font-heading font-bold text-xl text-primary">{formatINR(grandTotal)}</span>
            </div>

            {totalSavings > 0 && (
              <div className="mt-2 bg-primary/8 border border-primary/15 rounded-xl px-4 py-2.5 text-center">
                <p className="text-sm font-semibold text-primary">
                  🎉 You are saving {formatINR(totalSavings)} on this booking!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border/60">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-5 space-y-3">
          <Button
            className="w-full h-[52px] rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/20"
            size="lg"
            onClick={handlePayment}
          >
            <Lock className="h-4 w-4" />
            Proceed to Pay {formatINR(grandTotal)}
          </Button>

          <div className="flex items-center justify-center gap-5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Secure Payment</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BadgeCheck className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Verified Professionals</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
