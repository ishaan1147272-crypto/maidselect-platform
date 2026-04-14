import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 'Gurgaon'];

const AddMaid = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !hourlyRate) {
      toast.error('Name and Hourly Rate are required');
      return;
    }

    setSaving(true);
    try {
      let profileImageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('maid-images')
          .upload(filePath, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('maid-images')
          .getPublicUrl(filePath);
        profileImageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('maids').insert({
        name,
        bio: bio || null,
        experience_years: experience ? parseInt(experience) : null,
        hourly_rate: parseFloat(hourlyRate),
        city: city || null,
        phone: phone || null,
        profile_image_url: profileImageUrl,
        is_verified: isVerified,
      });
      if (error) throw error;

      toast.success('Maid profile created!');
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="container py-16 text-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container py-8 max-w-lg space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Admin
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Add New Maid</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Profile Image</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-32 w-32 rounded-lg object-cover mx-auto" />
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload photo</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required />
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short description..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Experience (years)</Label>
                <Input type="number" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 5" />
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate (₹) *</Label>
                <Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="e.g. 400" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Phone / WhatsApp Number</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 919876543210" />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isVerified} onCheckedChange={setIsVerified} />
              <Label>Is Verified</Label>
            </div>

            <Button className="w-full" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Create Maid Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddMaid;
