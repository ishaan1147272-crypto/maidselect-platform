import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const Success = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-5">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-heading font-bold text-foreground">Booking Confirmed</h1>
        <p className="text-sm text-muted-foreground max-w-[320px]">
          Your payment was successful. Our team will reach out to coordinate your service shortly.
        </p>
      </div>
      <Button onClick={() => navigate('/')} className="rounded-xl px-8 mt-2">
        Back to Home
      </Button>
    </div>
  );
};

export default Success;
