import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MaidCard } from '@/components/MaidCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Sparkles } from 'lucide-react';

const Index = () => {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('none');

  const { data: maids, isLoading } = useQuery({
    queryKey: ['maids'],
    queryFn: async () => {
      const { data, error } = await supabase.from('maids').select('*').eq('is_available', true).eq('is_verified', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('maid_id, rating');
      if (error) throw error;
      return data;
    },
  });

  const ratingMap = new Map<string, { sum: number; count: number }>();
  reviews?.forEach(r => {
    const curr = ratingMap.get(r.maid_id) || { sum: 0, count: 0 };
    curr.sum += r.rating;
    curr.count += 1;
    ratingMap.set(r.maid_id, curr);
  });

  const cities = [...new Set(maids?.map(m => m.city).filter(Boolean) || [])];

  let filtered = maids?.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || (m.city?.toLowerCase().includes(search.toLowerCase()));
    const matchCity = cityFilter === 'all' || m.city === cityFilter;
    return matchSearch && matchCity;
  }) || [];

  if (priceSort === 'low') filtered.sort((a, b) => a.hourly_rate - b.hourly_rate);
  if (priceSort === 'high') filtered.sort((a, b) => b.hourly_rate - a.hourly_rate);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent py-16 md:py-24">
        <div className="container text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />Trusted Home Care Professionals
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground leading-tight">
            Find Your Perfect<br />
            <span className="text-primary">Home Helper</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Browse verified, background-checked professionals in your city. Book in seconds.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="container py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priceSort} onValueChange={setPriceSort}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sort by Price</SelectItem>
              <SelectItem value="low">Low → High</SelectItem>
              <SelectItem value="high">High → Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-muted-foreground">No professionals found. Try adjusting your filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(m => {
              const r = ratingMap.get(m.id);
              return (
                <MaidCard
                  key={m.id}
                  id={m.id}
                  name={m.name}
                  city={m.city}
                  hourly_rate={m.hourly_rate}
                  experience_years={m.experience_years}
                  profile_image_url={m.profile_image_url}
                  is_verified={m.is_verified}
                  avgRating={r ? r.sum / r.count : null}
                  reviewCount={r?.count || 0}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
