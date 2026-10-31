import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { ChatPanel } from "@/components/ChatPanel";
import { getDisplayName } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/rides")({
  head: () => ({
    meta: [
      { title: "My rides – Car Chaos" },
      { name: "description", content: "Manage your carpool posts, requests and chats." },
      { property: "og:title", content: "My rides – Car Chaos" },
      { property: "og:description", content: "Manage your carpool posts, requests and chats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RidesPage,
});

type Req = { id: string; post_id: string; requester_id: string; requester_name: string; status: string };
type Post = { id: string; user_id: string; name: string; destination: string; leave_date: string; leave_time: string; seats: number };

function RidesPage() {
  const [me, setMe] = useState("");
  const [myName, setMyName] = useState("");
  const [myPosts, setMyPosts] = useState<(Post & { requests: Req[] })[]>([]);
  const [myReqs, setMyReqs] = useState<(Req & { post: Post | null })[]>([]);
  const [openChat, setOpenChat] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);
    setMyName(await getDisplayName(u.user.id));
    const { data: posts } = await supabase.from("ride_posts").select("*").eq("user_id", u.user.id).order("leave_date");
    const ids = (posts ?? []).map((p) => p.id);
    const { data: incoming } = ids.length
      ? await supabase.from("ride_requests").select("*").in("post_id", ids).order("created_at")
      : { data: [] as Req[] };
    setMyPosts((posts ?? []).map((p) => ({ ...p, requests: (incoming ?? []).filter((r) => r.post_id === p.id) })));
    const { data: mine } = await supabase.from("ride_requests").select("*, post:ride_posts(*)").eq("requester_id", u.user.id).order("created_at", { ascending: false });
    setMyReqs((mine ?? []) as (Req & { post: Post | null })[]);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`rides-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ride_requests" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  async function decide(id: string, status: "accepted" | "declined") {
    const { error } = await supabase.from("ride_requests").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "accepted" ? "Accepted! You can chat now." : "Request declined.");
    load();
  }

  async function removePost(id: string) {
    const { error } = await supabase.from("ride_posts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  const fmt = (p: Post) => `${new Date(p.leave_date).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${p.leave_time.slice(0, 5)}`;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-2xl font-bold">My posted rides</h2>
          {myPosts.length === 0 && (
            <div className="glass rounded-3xl p-6 text-sm text-muted-foreground">
              No rides posted. <Link to="/post" className="font-bold text-primary">Post one →</Link>
            </div>
          )}
          <div className="space-y-4">
            {myPosts.map((p) => (
              <div key={p.id} className="glass animate-rise rounded-3xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{p.destination}</h3>
                    <p className="text-sm text-muted-foreground">{fmt(p)} · {p.seats} seats</p>
                  </div>
                  <button onClick={() => removePost(p.id)} className="text-xs font-semibold text-destructive">Delete</button>
                </div>
                <div className="mt-3 space-y-2">
                  {p.requests.length === 0 && <p className="text-xs text-muted-foreground">No requests yet.</p>}
                  {p.requests.map((r) => (
                    <div key={r.id} className="rounded-2xl bg-card/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{r.requester_name}</span>
                        {r.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" className="rounded-full bg-gradient-primary" onClick={() => decide(r.id, "accepted")}>Accept</Button>
                            <Button size="sm" variant="outline" className="rounded-full" onClick={() => decide(r.id, "declined")}>Decline</Button>
                          </div>
                        ) : r.status === "accepted" ? (
                          <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setOpenChat(openChat === r.id ? null : r.id)}>
                            {openChat === r.id ? "Close" : "Chat"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Declined</span>
                        )}
                      </div>
                      {openChat === r.id && <ChatPanel roomId={r.id} me={me} myName={myName} otherName={r.requester_name} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold">My requests</h2>
          {myReqs.length === 0 && (
            <div className="glass rounded-3xl p-6 text-sm text-muted-foreground">
              No requests yet. <Link to="/search" className="font-bold text-primary">Find a ride →</Link>
            </div>
          )}
          <div className="space-y-4">
            {myReqs.map((r) => (
              <div key={r.id} className="glass animate-rise rounded-3xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-semibold">{r.post?.destination ?? "Ride removed"}</h3>
                    {r.post && <p className="text-sm text-muted-foreground">with {r.post.name} · {fmt(r.post)}</p>}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      r.status === "accepted" ? "bg-accent text-accent-foreground" : r.status === "declined" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.status === "declined" && (
                  <p className="mt-2 text-sm">
                    Not this time — <Link to="/search" className="font-bold text-primary">choose another ride →</Link>
                  </p>
                )}
                {r.status === "accepted" && r.post && (
                  <>
                    <Button size="sm" variant="secondary" className="mt-3 rounded-full" onClick={() => setOpenChat(openChat === r.id ? null : r.id)}>
                      {openChat === r.id ? "Close chat" : "Chat with " + r.post.name}
                    </Button>
                    {openChat === r.id && <ChatPanel roomId={r.id} me={me} myName={myName} otherName={r.post.name} />}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
