import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { getDisplayName } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Find a ride – Car Chaos" },
      { name: "description", content: "Search student carpools by destination, date and time." },
      { property: "og:title", content: "Find a ride – Car Chaos" },
      { property: "og:description", content: "Search student carpools by destination, date and time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

type Post = { id: string; user_id: string; name: string; destination: string; leave_date: string; leave_time: string; seats: number; gender_pref: string; preferences: string };

const prefLabel: Record<string, string> = { any: "Anyone", female: "Girls only", male: "Boys only" };

function SearchPage() {
  const [dest, setDest] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [results, setResults] = useState<Post[] | null>(null);
  const [me, setMe] = useState<string>("");
  const [requested, setRequested] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setMe(data.user.id);
      const { data: reqs } = await supabase.from("ride_requests").select("post_id,status").eq("requester_id", data.user.id);
      setRequested(Object.fromEntries((reqs ?? []).map((r) => [r.post_id, r.status])));
    });
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    let q = supabase.from("ride_posts").select("*").gte("leave_date", new Date().toISOString().slice(0, 10)).order("leave_date").order("leave_time").limit(100);
    const d = dest.trim().slice(0, 120);
    if (d) q = q.ilike("destination", `%${d.replace(/[%_]/g, "")}%`);
    if (date) q = q.eq("leave_date", date);
    const { data, error } = await q;
    if (error) { toast.error(error.message); return; }
    let rows = (data ?? []) as Post[];
    if (time) {
      const [h, m] = time.split(":").map(Number);
      const t = (h ?? 0) * 60 + (m ?? 0);
      rows = rows.filter((r) => {
        const [rh, rm] = r.leave_time.split(":").map(Number);
        return Math.abs((rh ?? 0) * 60 + (rm ?? 0) - t) <= 120;
      });
    }
    setResults(rows);
  }

  async function request(post: Post) {
    const name = await getDisplayName(me);
    const { error } = await supabase.from("ride_requests").insert({ post_id: post.id, requester_name: name });
    if (error) { toast.error(error.message.includes("duplicate") ? "You already requested this ride" : error.message); return; }
    setRequested({ ...requested, [post.id]: "pending" });
    toast.success("Request sent! We'll notify you when they respond.");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <form onSubmit={search} className="glass animate-rise grid gap-3 rounded-3xl p-5 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>Destination</Label>
            <Input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Where to?" maxLength={120} className="bg-card" />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-card" />
          </div>
          <div className="space-y-1.5">
            <Label>Time (±2h)</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-card" />
          </div>
          <Button type="submit" className="rounded-full bg-gradient-primary shadow-glow">Search</Button>
        </form>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {results?.length === 0 && (
            <p className="glass col-span-full rounded-3xl p-8 text-center text-muted-foreground">No matching rides yet — why not post one?</p>
          )}
          {results?.map((p, i) => {
            const status = requested[p.id];
            const mine = p.user_id === me;
            return (
              <div key={p.id} className="glass animate-rise rounded-3xl p-5" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-semibold">{p.destination}</h3>
                    <p className="text-sm text-muted-foreground">by {p.name}</p>
                  </div>
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">{p.seats} seats</span>
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {new Date(p.leave_date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · ⏰ {p.leave_time.slice(0, 5)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{prefLabel[p.gender_pref] ?? "Anyone"}</p>
                {p.preferences && <p className="mt-2 text-sm">{p.preferences}</p>}
                <Button
                  disabled={mine || !!status}
                  onClick={() => request(p)}
                  className="mt-4 w-full rounded-full bg-gradient-primary shadow-glow"
                >
                  {mine ? "Your ride" : status ? `Request ${status}` : "Send request"}
                </Button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
