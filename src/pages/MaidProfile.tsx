import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Star, MapPin, BadgeCheck, Clock, ArrowLeft, Calendar } from 'lucide-react';

const MaidProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scheduledDate, setScheduledDate] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: maid, isLoading } = useQuery({
    queryKey: ['maid', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('maids').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('*').eq('maid_id', id!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('bookings').insert({
        customer_id: user!.id,
        maid_id: id!,
        scheduled_date: new Date(scheduledDate).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Booking request sent!');
      setScheduledDate('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reviews').insert({
        maid_id: id!,
        customer_id: user!.id,
        rating,
        comment: comment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Review submitted!');
      setComment('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const avgRating = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  if (isLoading) return <div className="container py-16 text-center text-muted-foreground">Loading...</div>;
  if (!maid) return <div className="container py-16 text-center text-muted-foreground">Not found</div>;

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back
      </Button>

      <div className="flex flex-col sm:flex-row gap-6">
        <img
          src={maid.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(maid.name)}&size=400&background=2d9d78&color=fff`}
          alt={maid.name}
          className="w-full sm:w-48 h-48 rounded-xl object-cover"
        />
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-heading font-bold">{maid.name}</h1>
            {maid.is_verified && (
              <Badge className="bg-primary text-primary-foreground gap-1">
                <BadgeCheck className="h-3.5 w-3.5" />Verified
              </Badge>
            )}
          </div>
          {maid.city && <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{maid.city}</p>}
          <p className="text-2xl font-bold text-primary">₹{maid.hourly_rate}<span className="text-sm font-normal text-muted-foreground">/hr</span></p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {maid.experience_years != null && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{maid.experience_years} years exp</span>}
            {avgRating && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />{avgRating.toFixed(1)} ({reviews?.length})
              </span>
            )}
          </div>
        </div>
      </div>

      {maid.bio && (
        <Card>
          <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{maid.bio}</p></CardContent>
        </Card>
      )}

      {/* Booking */}
      {user && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />Request Booking</CardTitle></CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="flex-1" />
            <Button onClick={() => bookMutation.mutate()} disabled={!scheduledDate || bookMutation.isPending}>
              {bookMutation.isPending ? 'Sending...' : 'Request Booking'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      <Card>
        <CardHeader><CardTitle className="text-base">Reviews ({reviews?.length || 0})</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="space-y-3 border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Your rating:</span>
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => setRating(v)}>
                    <Star className={`h-5 w-5 ${v <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
              <Textarea placeholder="Leave a comment..." value={comment} onChange={e => setComment(e.target.value)} rows={2} />
              <Button size="sm" onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}>Submit Review</Button>
            </div>
          )}
          {reviews?.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          {reviews?.map(r => (
            <div key={r.id} className="space-y-1">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(v => (
                  <Star key={v} className={`h-3.5 w-3.5 ${v <= r.rating ? 'fill-warning text-warning' : 'text-muted-foreground/20'}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaidProfile;
