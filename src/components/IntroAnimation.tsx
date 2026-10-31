import { useEffect, useState } from "react";
import car from "@/assets/baby-car.png";

type Phase = "enter" | "wait" | "go" | "done";

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("enter");

  useEffect(() => {
    let cancelled = false;
    const minWait = new Promise((r) => setTimeout(r, 2600));
    const loaded = new Promise<void>((r) => {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", () => r(), { once: true });
    });
    const t = setTimeout(() => !cancelled && setPhase("wait"), 1800);
    Promise.all([minWait, loaded]).then(() => {
      if (cancelled) return;
      setPhase("go");
      setTimeout(() => {
        if (cancelled) return;
        setPhase("done");
        onDone();
      }, 1600);
    });
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [onDone]);

  const green = phase === "go" || phase === "done";
  const moving = phase === "enter" || phase === "go";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-lime-scene" aria-label="Loading Car Chaos">
      {/* sun glow */}
      <div className="absolute left-1/2 top-[12%] h-72 w-72 -translate-x-1/2 rounded-full bg-lime opacity-60 blur-3xl" />

      {/* traffic light */}
      <div className="absolute left-1/2 top-[18%] flex -translate-x-1/2 flex-col items-center sm:left-[62%]">
        <div className="flex flex-col gap-3 rounded-3xl bg-road p-3 shadow-2xl ring-4 ring-road/40">
          <span
            className={`h-10 w-10 rounded-full transition-all duration-300 ${
              green ? "bg-signal-off" : "bg-signal-red text-signal-red animate-glow"
            }`}
          />
          <span className="h-10 w-10 rounded-full bg-signal-off" />
          <span
            className={`h-10 w-10 rounded-full transition-all duration-300 ${
              green ? "bg-signal-green text-signal-green animate-glow" : "bg-signal-off"
            }`}
          />
        </div>
        <div className="h-40 w-3 rounded-b bg-road" />
      </div>

      {/* road */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-road">
        <div
          className={`absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 ${moving ? "animate-road" : ""}`}
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--color-lime) 0 80px, transparent 80px 160px)",
            backgroundSize: "160px 100%",
          }}
        />
      </div>

      {/* car */}
      <div className="absolute bottom-[18%] left-1/2 w-[70vw] max-w-[380px] -translate-x-1/2">
        <div
          className={
            phase === "enter" ? "animate-car-enter" : phase === "wait" ? "" : "animate-car-leave"
          }
        >
          <div className="relative animate-car-bounce">
            {green && (
              <div className="absolute bottom-[18%] right-[-4%]">
                {[0, 0.2, 0.4, 0.6].map((d) => (
                  <span
                    key={d}
                    className="absolute h-10 w-10 rounded-full bg-muted opacity-80 animate-puff"
                    style={{ animationDelay: `${d}s` }}
                  />
                ))}
              </div>
            )}
            <img src={car} alt="Cute blue baby car" width={1024} height={768} className="relative drop-shadow-2xl" />
          </div>
        </div>
      </div>

      <p className="absolute bottom-6 inset-x-0 text-center font-display text-lg text-primary-foreground drop-shadow">
        {green ? "Green light — let's roll!" : "Warming up the engine…"}
      </p>
    </div>
  );
}
