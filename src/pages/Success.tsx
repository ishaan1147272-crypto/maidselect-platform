import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, Check } from 'lucide-react';

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  // Payment ID can come from navigation state or query param (?payment_id=...)
  const stateId = (location.state as any)?.razorpay_payment_id as string | undefined;
  const queryId = new URLSearchParams(location.search).get('payment_id') ?? undefined;
  const paymentId = stateId || queryId;

  useEffect(() => {
    // Block back navigation into the cart/payment flow
    window.history.replaceState(null, '', '/success');
  }, []);

  const handleCopy = async () => {
    if (!paymentId) return;
    await navigator.clipboard.writeText(paymentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-5">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-500">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-heading font-bold text-foreground">Payment Successful</h1>
        <p className="text-sm text-muted-foreground">
          Your booking is confirmed. Our team will reach out shortly to coordinate your service.
        </p>
      </div>

      {paymentId && (
        <div className="bg-card border border-border/60 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="text-left">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Payment ID</p>
            <p className="text-sm font-mono text-foreground">{paymentId}</p>
          </div>
          <button
            onClick={handleCopy}
            className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"
            aria-label="Copy payment ID"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <Button variant="outline" onClick={() => navigate('/bookings')} className="rounded-xl px-6">
          View Bookings
        </Button>
        <Button onClick={() => navigate('/')} className="rounded-xl px-6">
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default Success;
