import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
};

export function ChatPanel({
  roomId,
  me,
  myName,
  otherName,
}: {
  roomId: string;
  me: string;
  myName: string;
  otherName: string;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const broadcastChRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setSendError("");
    try {
      const { data, error } = await supabase
        .from("ride_messages")
        .select("*")
        .eq("request_id", roomId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMsgs(data as Msg[]);
      }
    } catch {
      // Graceful fallback to in-memory room if table is pending
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !me) return;
    loadHistory();

    // 1. Listen for new messages inserted into database
    const dbChannel = supabase
      .channel(`db-msgs-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ride_messages",
          filter: `request_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as Msg;
          setMsgs((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
        }
      )
      .subscribe();

    // 2. Also listen over live broadcast so messages deliver instantly
    const bcChannel = supabase
      .channel(`live-chat-${roomId}`, {
        config: { broadcast: { self: true, ack: true } },
      })
      .on("broadcast", { event: "msg" }, ({ payload }) => {
        const liveMsg = payload as Msg;
        setMsgs((prev) => (prev.some((m) => m.id === liveMsg.id) ? prev : [...prev, liveMsg]));
      })
      .subscribe();

    broadcastChRef.current = bcChannel;

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(bcChannel);
    };
  }, [roomId, me, loadHistory]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim().slice(0, 1000);
    if (!trimmed || sending) return;

    setSending(true);
    setSendError("");

    const localMsg: Msg = {
      id: crypto.randomUUID(),
      sender_id: me,
      sender_name: myName,
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    let delivered = false;

    // Save to database
    try {
      const { error } = await supabase.from("ride_messages").insert({
        id: localMsg.id,
        request_id: roomId,
        sender_id: me,
        sender_name: myName,
        content: trimmed,
      });
      if (!error) delivered = true;
    } catch {
      // Handled by broadcast fallback
    }

    // Broadcast fallback for instant delivery
    try {
      if (broadcastChRef.current) {
        await broadcastChRef.current.send({
          type: "broadcast",
          event: "msg",
          payload: localMsg,
        });
        delivered = true;
      }
    } catch {
      // Ignored if already saved to DB
    }

    if (delivered) {
      setText("");
      setMsgs((prev) => (prev.some((m) => m.id === localMsg.id) ? prev : [...prev, localMsg]));
    } else {
      setSendError("Message could not be sent. Please try again.");
    }

    setSending(false);
  }

  return (
    <div className="mt-3 overflow-hidden rounded-3xl border border-border/50 bg-card/90 shadow-xl backdrop-blur-md">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/40 bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
            {otherName.slice(0, 1).toUpperCase()}
          </div>
          <span>
            Chat with <b className="text-foreground">{otherName}</b>
          </span>
        </div>
        <span className="text-[11px] font-medium text-lime-deep">Private ride chat</span>
      </div>

      {/* Message Bubbles */}
      <div className="max-h-64 min-h-28 space-y-2 overflow-y-auto p-4">
        {loading && (
          <p className="py-6 text-center text-xs text-muted-foreground animate-pulse">
            Loading messages...
          </p>
        )}

        {!loading && msgs.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">No messages yet</p>
            <p className="mt-0.5">Send a message to coordinate your ride.</p>
          </div>
        )}

        {msgs.map((m) => {
          const isMe = m.sender_id === me;
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                  isMe
                    ? "rounded-br-xs bg-gradient-primary text-primary-foreground"
                    : "rounded-bl-xs border border-border/40 bg-secondary/80 text-foreground"
                }`}
              >
                <p className="break-words">{m.content}</p>
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">
                {formatTime(m.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={send} className="border-t border-border/40 bg-secondary/30 p-2.5">
        <div className="flex gap-2">
          <Input
            aria-label="Message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={1000}
            disabled={sending}
            className="rounded-full border-border/50 bg-background px-4 text-sm"
          />
          <Button
            type="submit"
            disabled={sending || !text.trim()}
            className="rounded-full bg-gradient-primary px-5 font-semibold text-primary-foreground"
          >
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
        {sendError && (
          <p role="alert" className="mt-1.5 px-2 text-xs text-destructive">
            {sendError}
          </p>
        )}
      </form>
    </div>
  );
}
