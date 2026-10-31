import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/** Live toasts: new requests for post owners, accept/decline for requesters. */
export function RequestNotifier() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`req-notify-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ride_requests" }, (payload) => {
        const row = payload.new as { requester_id?: string; status?: string; requester_name?: string };
        if (payload.eventType === "INSERT" && row.requester_id !== user.id) {
          toast(`${row.requester_name} wants to join your ride!`, { description: "Open My rides to accept." });
        }
        if (payload.eventType === "UPDATE" && row.requester_id === user.id) {
          if (row.status === "accepted") toast.success("Your ride request was accepted! Open My rides to chat.");
          if (row.status === "declined")
            toast.error("Your request was declined — please choose another ride.");
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
