import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { IntroAnimation } from "@/components/IntroAnimation";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Car Chaos – VIT on Wheels | Student carpooling" },
      { name: "description", content: "Post or find carpool rides with fellow VIT students. Share the trip, split the fare." },
      { property: "og:title", content: "Car Chaos – VIT on Wheels" },
      { property: "og:description", content: "Post or find carpool rides with fellow VIT students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [introDone, setIntroDone] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const done = useCallback(() => setIntroDone(true), []);

  useEffect(() => {
    supabase.rpc("booked_rides_count").then(({ data }) => setCount((data as number) ?? 0));
  }, []);

  return (
    <>
      {!introDone && <IntroAnimation onDone={done} />}
      <div className="relative min-h-screen overflow-hidden">
        <img src={hero} alt="" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover object-bottom opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/20 to-background" />
        <div className="relative">
          <SiteHeader />
          <main className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-10 text-center sm:pt-16">
            <span className="glass animate-rise rounded-full px-4 py-1 text-sm font-semibold text-secondary-foreground">
              Student carpooling, made cute
            </span>
            <h1 className="text-glossy animate-rise mt-4 text-6xl font-bold leading-none tracking-tight sm:text-8xl" style={{ animationDelay: "0.1s" }}>
              Car Chaos
            </h1>
            <p className="animate-rise mt-2 font-display text-2xl font-medium text-foreground sm:text-3xl" style={{ animationDelay: "0.2s" }}>
              VIT on Wheels
            </p>

            <div className="glass animate-rise mt-6 rounded-2xl px-5 py-3" style={{ animationDelay: "0.3s" }}>
              <p className="font-display text-4xl font-bold text-primary">{count ?? "—"}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">rides booked so far</p>
            </div>

            <div className="mt-[22vh] grid w-full max-w-2xl gap-4 sm:mt-[28vh] sm:grid-cols-2">
              <Link to="/post" className="glass animate-rise group rounded-3xl p-6 text-left transition hover:-translate-y-1" style={{ animationDelay: "0.4s" }}>
                <h2 className="mt-2 text-2xl font-semibold">Post a ride</h2>
                <p className="mt-1 text-sm text-muted-foreground">Leaving soon? Share your trip and pick your carpool mates.</p>
                <span className="mt-4 inline-block rounded-full bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow">Create proposal →</span>
              </Link>
              <Link to="/search" className="glass animate-rise group rounded-3xl p-6 text-left transition hover:-translate-y-1" style={{ animationDelay: "0.5s" }}>
                <h2 className="mt-2 text-2xl font-semibold">Find a ride</h2>
                <p className="mt-1 text-sm text-muted-foreground">Search by destination, date and time and send a request.</p>
                <span className="mt-4 inline-block rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-glow">Search rides →</span>
              </Link>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
