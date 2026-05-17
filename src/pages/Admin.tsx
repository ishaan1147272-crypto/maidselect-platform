import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, Users, BookOpen, MessageSquare, IndianRupee, Upload, Loader2, Eye, EyeOff, ShieldAlert } from 'lucide-react';

const ADMIN_EMAIL = 'ishaan1147272@gmail.com';

interface MaidForm {
  name: string;
  bio: string;
  city: string;
  profile_image_url: string;
  hourly_rate: string;
  weekly_rate: string;
  monthly_rate: string;
  is_visible: boolean;
}
const emptyForm: MaidForm = {
  name: '', bio: '', city: '', profile_image_url: '',
  hourly_rate: '', weekly_rate: '', monthly_rate: '', is_visible: true,
};

const Admin = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MaidForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- Strict admin gate by email ----
  if (loading) {
    return <div className="container py-16 text-center text-muted-foreground">Loading...</div>;
  }
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return (
      <div className="container py-16 max-w-md text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          This area is restricted to the site owner. Please sign in with the authorized admin account.
        </p>
        <Button asChild><a href="/">Back to Home</a></Button>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `maid_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('maid-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const publicUrl = supabase.storage.from('maid-photos').getPublicUrl(filePath).data.publicUrl;
      setForm(prev => ({ ...prev, profile_image_url: publicUrl }));

      if (editingId) {
        const { error: updErr } = await supabase
          .from('maids')
          .update({ profile_image_url: publicUrl })
          .eq('id', editingId);
        if (updErr) throw updErr;
        queryClient.invalidateQueries({ queryKey: ['admin-maids'] });
      }
      toast.success('Photo uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

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
        city: form.city || null,
        profile_image_url: form.profile_image_url || null,
        hourly_rate: parseFloat(form.hourly_rate),
        weekly_rate: form.weekly_rate ? parseFloat(form.weekly_rate) : null,
        monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
        is_visible: form.is_visible,
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

  const toggleVisible = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from('maids').update({ is_visible: val }).eq('id', id);
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

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      bio: m.bio || '',
      city: m.city || '',
      profile_image_url: m.profile_image_url || '',
      hourly_rate: m.hourly_rate?.toString() || '',
      weekly_rate: m.weekly_rate?.toString() || '',
      monthly_rate: m.monthly_rate?.toString() || '',
      is_visible: m.is_visible ?? true,
    });
    setDialogOpen(true);
  };

  return (
    <div className="container py-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><IndianRupee className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-xl font-bold">₹{totalRevenue.toLocaleString()}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><BookOpen className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Confirmed Bookings</p><p className="text-xl font-bold">{confirmedBookings.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Total Maids</p><p className="text-xl font-bold">{maids?.length || 0}</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="maids">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="maids" className="gap-1.5"><Users className="h-4 w-4" />Maids</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5"><MessageSquare className="h-4 w-4" />Reviews</TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1.5"><BookOpen className="h-4 w-4" />Bookings</TabsTrigger>
        </TabsList>

        {/* MAIDS TAB */}
        <TabsContent value="maids" className="space-y-4">
          <Button onClick={openNew}><Plus className="mr-1.5 h-4 w-4" />Add Maid</Button>

          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditingId(null); } }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingId ? 'Edit Maid' : 'New Maid'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {/* Image upload + preview */}
                <div className="flex items-center gap-4">
                  {form.profile_image_url ? (
                    <img src={form.profile_image_url} alt="Maid preview" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">No photo</div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full gap-2">
                      {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4" />Upload Maid Photo</>}
                    </Button>
                    {form.profile_image_url && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, profile_image_url: '' })} className="w-full text-xs h-7">Remove</Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>Location / City</Label>
                  <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>Professional Description</Label>
                  <Textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Multi-Tier Pricing (₹)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs text-muted-foreground">Hourly *</Label>
                      <Input type="number" placeholder="₹/hour" value={form.hourly_rate} onChange={e => setForm({...form, hourly_rate: e.target.value})} />
                    </div>
                    <div><Label className="text-xs text-muted-foreground">Weekly</Label>
                      <Input type="number" placeholder="₹/week" value={form.weekly_rate} onChange={e => setForm({...form, weekly_rate: e.target.value})} />
                    </div>
                    <div><Label className="text-xs text-muted-foreground">Monthly</Label>
                      <Input type="number" placeholder="₹/month" value={form.monthly_rate} onChange={e => setForm({...form, monthly_rate: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label>Hide Maid from Website</Label>
                    <p className="text-xs text-muted-foreground">When hidden, this profile won't appear publicly.</p>
                  </div>
                  <Switch checked={!form.is_visible} onCheckedChange={(v) => setForm({...form, is_visible: !v})} />
                </div>

                <Button className="w-full" onClick={() => saveMaid.mutate()} disabled={!form.name || !form.hourly_rate || saveMaid.isPending}>
                  {saveMaid.isPending ? 'Saving...' : editingId ? 'Update Maid' : 'Create Maid'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-3">
            {maids?.map((m: any) => (
              <Card key={m.id} className={!m.is_visible ? 'opacity-70' : ''}>
                <CardContent className="flex items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {m.profile_image_url ? (
                      <img src={m.profile_image_url} alt={m.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{m.name}</span>
                        {m.is_visible ? (
                          <Badge variant="secondary" className="text-xs gap-1"><Eye className="h-3 w-3" />Visible</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs gap-1"><EyeOff className="h-3 w-3" />Hidden</Badge>
                        )}
                        {m.city && <span className="text-xs text-muted-foreground">• {m.city}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ₹{m.hourly_rate}/hr
                        {m.weekly_rate ? ` • ₹${m.weekly_rate}/wk` : ''}
                        {m.monthly_rate ? ` • ₹${m.monthly_rate}/mo` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Visible</span>
                      <Switch checked={m.is_visible} onCheckedChange={val => toggleVisible.mutate({ id: m.id, val })} />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${m.name}?`)) deleteMaid.mutate(m.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
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
