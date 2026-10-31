import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in – Car Chaos" },
      { name: "description", content: "Sign in to post and request carpool rides." },
      { property: "og:title", content: "Sign in – Car Chaos" },
      { property: "og:description", content: "Sign in to post and request carpool rides." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must contain at least 3 characters")
  .max(24, "Username cannot exceed 24 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers and underscores");

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .max(72, "Password cannot exceed 72 characters")
  .regex(/[a-z]/, "Add at least one lowercase letter")
  .regex(/[A-Z]/, "Add at least one uppercase letter")
  .regex(/[0-9]/, "Add at least one number")
  .regex(/[^A-Za-z0-9]/, "Add at least one special character");

// Supabase password auth expects an email identifier. This deterministic, reserved
// .invalid address is an internal login key only; users never enter or receive email.
function usernameLoginId(username: string) {
  return `${username.trim().toLowerCase()}@car-chaos.invalid`;
}

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsedUsername = usernameSchema.safeParse(username);
    if (!parsedUsername.success) {
      toast.error(parsedUsername.error.issues[0]?.message ?? "Enter a valid username");
      return;
    }
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) {
      toast.error(parsedPassword.error.issues[0]?.message ?? "Enter a stronger password");
      return;
    }

    if (mode === "up" && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setBusy(true);
    const loginId = usernameLoginId(parsedUsername.data);

    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email: loginId,
        password,
        options: {
          data: {
            username: parsedUsername.data.toLowerCase(),
            display_name: parsedUsername.data,
          },
        },
      });
      setBusy(false);
      if (error) {
        const message = /already|registered|unique|duplicate/i.test(error.message)
          ? "That username is already taken. Please choose another."
          : error.message;
        toast.error(message);
        return;
      }
      if (!data.session) {
        toast.error(
          "Account creation is not finished: disable email confirmation in your Supabase Auth settings. No email is used by this website.",
          { duration: 8000 },
        );
        return;
      }
      toast.success("Your account has been created!");
      navigate({ to: "/rides" });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginId, password });
    setBusy(false);
    if (error) {
      toast.error("Incorrect username or password");
      return;
    }
    navigate({ to: "/rides" });
  }

  function switchMode() {
    setMode(mode === "in" ? "up" : "in");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="glass animate-rise rounded-3xl p-6">
          <h1 className="text-3xl font-bold">{mode === "in" ? "Welcome back" : "Join the ride"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "in"
              ? "Sign in with your username and password."
              : "Create your own username and password. No email or phone number required."}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={24}
                required
                className="bg-card"
                placeholder="Your unique username"
              />
              {mode === "up" && (
                <p className="text-xs text-muted-foreground">3–24 characters. Letters, numbers and underscores only.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                required
                className="bg-card"
                placeholder="Enter your password"
              />
              {mode === "up" && (
                <p className="text-xs text-muted-foreground">At least 8 characters, including uppercase, lowercase, a number and a special character.</p>
              )}
            </div>
            {mode === "up" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  maxLength={72}
                  required
                  className="bg-card"
                  placeholder="Enter your password again"
                />
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full rounded-full bg-gradient-primary shadow-glow">
              {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <button onClick={switchMode} className="mt-4 w-full text-center text-sm font-semibold text-primary">
            {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Your username and password are used only to access your account. Do not share your password.
          </p>
        </div>
      </main>
    </div>
  );
}
