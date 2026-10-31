import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import car from "@/assets/baby-car.png";

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <nav className="glass mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full px-4 py-2">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <img src={car} alt="" width={40} height={30} className="h-7 w-auto" />
          <span className="hidden sm:inline">Car Chaos</span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-semibold">
          <Link to="/post" className="rounded-full px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "bg-secondary" }}>
            Post
          </Link>
          <Link to="/search" className="rounded-full px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "bg-secondary" }}>
            Search
          </Link>
          <Link to="/rides" className="rounded-full px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "bg-secondary" }}>
            My rides
          </Link>
          {user ? (
            <Button size="sm" variant="ghost" className="rounded-full" onClick={signOut}>
              Sign out
            </Button>
          ) : (
            <Button size="sm" asChild className="rounded-full bg-gradient-primary">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
