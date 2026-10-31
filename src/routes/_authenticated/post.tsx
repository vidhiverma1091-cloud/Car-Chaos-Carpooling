import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { getDisplayName } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/post")({
  head: () => ({
    meta: [
      { title: "Post a ride – Car Chaos" },
      { name: "description", content: "Share your trip and find carpool mates." },
      { property: "og:title", content: "Post a ride – Car Chaos" },
      { property: "og:description", content: "Share your trip and find carpool mates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PostPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  destination: z.string().trim().min(1, "Destination is required").max(120),
  leave_date: z.string().min(1, "Pick a date"),
  leave_time: z.string().min(1, "Pick a time"),
  seats: z.number().int().min(1).max(8),
  gender_pref: z.enum(["any", "female", "male"]),
  preferences: z.string().trim().max(500),
});

function PostPage() {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", destination: "", leave_date: "", leave_time: "", seats: 3, gender_pref: "any", preferences: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const n = await getDisplayName(data.user.id, "");
        setF((p) => ({ ...p, name: p.name || n }));
      }
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setBusy(true);
    const { error } = await supabase.from("ride_posts").insert(parsed.data);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Ride posted! You'll be notified when someone requests.");
    navigate({ to: "/rides" });
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: k === "seats" ? Number(e.target.value) : e.target.value });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="glass animate-rise rounded-3xl p-6">
          <h1 className="text-3xl font-bold">Post a carpool</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tell others where you're headed.</p>
          <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Your name" className="sm:col-span-2">
              <Input value={f.name} onChange={set("name")} maxLength={80} className="bg-card" />
            </Field>
            <Field label="Destination" className="sm:col-span-2">
              <Input value={f.destination} onChange={set("destination")} placeholder="e.g. Chennai Airport" maxLength={120} className="bg-card" />
            </Field>
            <Field label="Date of leaving">
              <Input type="date" value={f.leave_date} onChange={set("leave_date")} min={new Date().toISOString().slice(0, 10)} className="bg-card" />
            </Field>
            <Field label="Time">
              <Input type="time" value={f.leave_time} onChange={set("leave_time")} className="bg-card" />
            </Field>
            <Field label="Seats available">
              <Input type="number" min={1} max={8} value={f.seats} onChange={set("seats")} className="bg-card" />
            </Field>
            <Field label="Co-rider preference">
              <select value={f.gender_pref} onChange={set("gender_pref")} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option value="any">Anyone</option>
                <option value="female">Girls only</option>
                <option value="male">Boys only</option>
              </select>
            </Field>
            <Field label="Additional preferences" className="sm:col-span-2">
              <Textarea value={f.preferences} onChange={set("preferences")} maxLength={500} placeholder="Luggage, music, split fare, non-smoking…" className="bg-card" />
            </Field>
            <Button type="submit" disabled={busy} className="rounded-full bg-gradient-primary shadow-glow sm:col-span-2">
              {busy ? "Posting…" : "Post ride "}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
