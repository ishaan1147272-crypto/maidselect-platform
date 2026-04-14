import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, Users, BookOpen, MessageSquare, IndianRupee } from 'lucide-react';

interface MaidForm {
  name: string; bio: string; experience_years: string; hourly_rate: string; city: string; profile_image_url: string;
}
const emptyForm: MaidForm = { name: '', bio: '', experience_years: '', hourly_rate: '', city: '', profile_image_url: '' };

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MaidForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: maids } = useQuery({
    queryKey: ['admin-maids'],
    queryFn: async () => {
      const { data, error } = await supabase.from('maids').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('*, maids(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('*, maids(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const confirmedBookings = bookings?.filter(b => b.status === 'confirmed' || b.payment_status === 'paid') || [];
  const totalRevenue = bookings?.reduce((sum, b) => sum + ((b.total_amount || 0) + (b.platform_fee || 0)), 0) || 0;

  const saveMaid = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        bio: form.bio || null,
        experience_years: form.experience_years ? parseInt(form.experience_years) : null,
        hourly_rate: parseFloat(form.hourly_rate),
        city: form.city || null,
        profile_image_url: form.profile_image_url || null,
      };
      if (editingId) {
        const { error } = await supabase.from('maids').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('maids').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? 'Maid updated!' : 'Maid created!');
      queryClient.invalidateQueries({ queryKey: ['admin-maids'] });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleVerified = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from('maids').update({ is_verified: val }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-maids'] }),
  });

  const deleteMaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('maids').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: ['admin-maids'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Review deleted'); queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (loading) return <div className="container py-16 text-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      name: m.name, bio: m.bio || '', experience_years: m.experience_years?.toString() || '',
      hourly_rate: m.hourly_rate.toString(), city: m.city || '', profile_image_url: m.profile_image_url || '',
    });
    setDialogOpen(true);
  };

  return (
    <div className="container py-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confirmed Bookings</p>
              <p className="text-xl font-bold">{confirmedBookings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Maids</p>
              <p className="text-xl font-bold">{maids?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="maids">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="maids" className="gap-1.5"><Users className="h-4 w-4" />Maids</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5"><MessageSquare className="h-4 w-4" />Reviews</TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1.5"><BookOpen className="h-4 w-4" />Bookings</TabsTrigger>
        </TabsList>

        {/* MAIDS TAB */}
        <TabsContent value="maids" className="space-y-4">
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditingId(null); } }}>
            <Button asChild><Link to="/admin/add-maid"><Plus className="mr-1.5 h-4 w-4" />Add Maid</Link></Button>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? 'Edit Maid' : 'New Maid'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <Textarea placeholder="Bio" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Experience (years)" type="number" value={form.experience_years} onChange={e => setForm({...form, experience_years: e.target.value})} />
                  <Input placeholder="Hourly Rate *" type="number" value={form.hourly_rate} onChange={e => setForm({...form, hourly_rate: e.target.value})} />
                </div>
                <Input placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                <Input placeholder="Profile Image URL" value={form.profile_image_url} onChange={e => setForm({...form, profile_image_url: e.target.value})} />
                <Button className="w-full" onClick={() => saveMaid.mutate()} disabled={!form.name || !form.hourly_rate || saveMaid.isPending}>
                  {saveMaid.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-3">
            {maids?.map(m => (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between p-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{m.name}</span>
                      {m.is_verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                      <span className="text-sm text-muted-foreground">₹{m.hourly_rate}/hr</span>
                      {m.city && <span className="text-sm text-muted-foreground">• {m.city}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Verified</span>
                      <Switch checked={m.is_verified} onCheckedChange={val => toggleVerified.mutate({ id: m.id, val })} />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMaid.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!maids?.length && <p className="text-center py-8 text-muted-foreground">No maids yet.</p>}
          </div>
        </TabsContent>

        {/* REVIEWS TAB */}
        <TabsContent value="reviews" className="space-y-3">
          {reviews?.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{r.maids?.name || 'Unknown'}</span>
                    <div className="flex">{[1,2,3,4,5].map(v => <Star key={v} className={`h-3 w-3 ${v <= r.rating ? 'fill-warning text-warning' : 'text-muted'}`} />)}</div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteReview.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
          {!reviews?.length && <p className="text-center py-8 text-muted-foreground">No reviews yet.</p>}
        </TabsContent>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings" className="space-y-3">
          {bookings?.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between p-4 gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{b.maids?.name || 'Unknown'}</span>
                    {b.payment_status === 'paid' && <Badge className="text-xs bg-primary/10 text-primary">Paid</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.scheduled_date).toLocaleString()}
                    {b.total_hours && ` • ${b.total_hours}hrs`}
                    {b.total_amount && ` • ₹${b.total_amount}`}
                    {b.platform_fee ? ` + ₹${b.platform_fee} fee` : ''}
                  </p>
                  {b.payment_id && <p className="text-xs text-muted-foreground font-mono">Pay: {b.payment_id}</p>}
                </div>
                <Select value={b.status} onValueChange={status => updateBookingStatus.mutate({ id: b.id, status })}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
          {!bookings?.length && <p className="text-center py-8 text-muted-foreground">No bookings yet.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
