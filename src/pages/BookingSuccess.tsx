import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, MessageCircle, Home, Phone } from 'lucide-react';
import confetti from 'canvas-confetti';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const maidIds = searchParams.get('maids')?.split(',').filter(Boolean) || [];

  const { data: maids } = useQuery({
    queryKey: ['booked-maids', maidIds],
    queryFn: async () => {
      if (maidIds.length === 0) return [];
      const { data, error } = await supabase.from('maids').select('id, name, phone, profile_image_url').in('id', maidIds);
      if (error) throw error;
      return data;
    },
    enabled: maidIds.length > 0,
  });

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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 p-8 max-w-md w-full">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-fade-in">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground animate-fade-in">Booking Confirmed!</h1>
        <p className="text-muted-foreground animate-fade-in">
          Your payment was successful. Here are your booked professionals:
        </p>

        {maids && maids.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            {maids.map(maid => (
              <Card key={maid.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <img
                    src={maid.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(maid.name)}&size=80&background=2d9d78&color=fff`}
                    alt={maid.name}
                    className="h-12 w-12 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">{maid.name}</p>
                    {maid.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />{maid.phone}
                      </p>
                    )}
                  </div>
                  {maid.phone && (
                    <Button size="sm" className="gap-1 bg-[#25D366] hover:bg-[#1da851] text-white shrink-0" asChild>
                      <a
                        href={`https://wa.me/${maid.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I just booked you on MaidSelect!')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" />WhatsApp
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
