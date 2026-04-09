import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, MessageCircle, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

const BookingSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-fade-in">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground animate-fade-in">Booking Confirmed!</h1>
        <p className="text-muted-foreground animate-fade-in">
          Your payment was successful. Our team will coordinate with the professional and get back to you shortly.
        </p>
        <div className="flex flex-col gap-3 animate-fade-in">
          <Button size="lg" className="w-full gap-2 bg-[#25D366] hover:bg-[#1da851] text-white" asChild>
            <a href="https://wa.me/919999999999?text=Hi%2C%20I%20just%20completed%20a%20booking%20on%20MaidSelect" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />Chat with Support on WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="lg" className="w-full gap-2" onClick={() => navigate('/')}>
            <Home className="h-5 w-5" />Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
