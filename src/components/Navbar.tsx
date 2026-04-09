import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">M</span>
          </div>
          <span className="text-xl font-heading font-bold text-foreground">MaidSelect</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin"><Shield className="mr-1.5 h-4 w-4" />Admin</Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-1.5 h-4 w-4" />Sign Out
              </Button>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-2">
          {user ? (
            <>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {isAdmin && (
                <Button variant="outline" size="sm" className="w-full" asChild onClick={() => setMenuOpen(false)}>
                  <Link to="/admin"><Shield className="mr-1.5 h-4 w-4" />Admin</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { signOut(); setMenuOpen(false); }}>
                <LogOut className="mr-1.5 h-4 w-4" />Sign Out
              </Button>
            </>
          ) : (
            <Button size="sm" className="w-full" asChild onClick={() => setMenuOpen(false)}>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};
