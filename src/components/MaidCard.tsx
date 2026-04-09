import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, BadgeCheck, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface MaidCardProps {
  id: string;
  name: string;
  city: string | null;
  hourly_rate: number;
  experience_years: number | null;
  profile_image_url: string | null;
  is_verified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

export const MaidCard = ({ id, name, city, hourly_rate, experience_years, profile_image_url, is_verified, avgRating, reviewCount }: MaidCardProps) => {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(id);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg animate-fade-in group">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400&background=2d9d78&color=fff`}
          alt={name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {is_verified && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground gap-1">
            <BadgeCheck className="h-3.5 w-3.5" />Verified
          </Badge>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-heading font-semibold text-lg text-card-foreground">{name}</h3>
          <span className="text-lg font-bold text-primary">₹{hourly_rate}<span className="text-xs font-normal text-muted-foreground">/hr</span></span>
        </div>
        {city && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />{city}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {avgRating ? (
              <>
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({reviewCount})</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No reviews yet</span>
            )}
          </div>
          {experience_years != null && (
            <span className="text-xs text-muted-foreground">{experience_years}yr exp</span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Button className="flex-1" size="sm" asChild>
            <Link to={`/maid/${id}`}>View Profile</Link>
          </Button>
          <Button
            variant={inCart ? "secondary" : "outline"}
            size="sm"
            onClick={() => !inCart && addItem({ id, name, hourly_rate, city, profile_image_url })}
            disabled={inCart}
            className="gap-1"
          >
            {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {inCart ? 'Added' : 'Select'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
