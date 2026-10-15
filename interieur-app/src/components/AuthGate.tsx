"use client";

import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import { fetchIdentity, loadState, sendInvite } from "@/lib/remote";
import { clearSyncError, emptyState, replaceState, setSyncFailedHandler, useSyncError } from "@/lib/store";
import { studio } from "@/lib/studio";
import { isLive, supabase } from "@/lib/supabase";
import { Button, Card, inputClass } from "@/components/ui";
import Logo from "@/components/Logo";

type Phase = "loading" | "signed-out" | "no-access" | "ready" | "error";

const LiveUser = createContext<{ email: string; signOut: () => void } | null>(null);

// In de live-versie: wie is er ingelogd? null in de demo.
export function useLiveUser() {
  return useContext(LiveUser);
}

export default function AuthGate({ children }: { children: ReactNode }) {
  if (!isLive) return <>{children}</>;
  return <LiveGate>{children}</LiveGate>;
}

function LiveGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [email, setEmail] = useState("");
  const syncError = useSyncError();

  useEffect(() => {
    const db = supabase!;
    let channel: RealtimeChannel | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function start(session: Session | null) {
      if (channel) {
        db.removeChannel(channel);
        channel = null;
      }
      if (!session) {
        replaceState(emptyState);
        setPhase("signed-out");
        return;
      }
      setEmail(session.user.email ?? "");
      try {
        const identity = await fetchIdentity();
        if (!identity) {
          setPhase("no-access");
          return;
        }
        const reload = async () => replaceState(await loadState(emptyState, identity));
        await reload();
        setSyncFailedHandler(() => void reload());
        // Wijzigingen van anderen (klant, studio) komen direct binnen.
        channel = db
          .channel("wijzigingen")
          .on("postgres_changes", { event: "*", schema: "public" }, () => {
            clearTimeout(timer);
            timer = setTimeout(() => void reload(), 400);
          })
          .subscribe();
        setPhase("ready");
      } catch {
        setPhase("error");
      }
    }

    const { data } = db.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return;
      // Supabase raadt aan geen andere Supabase-aanroepen direct in deze callback te doen.
      setTimeout(() => void start(session), 0);
    });

    return () => {
      data.subscription.unsubscribe();
      clearTimeout(timer);
      setSyncFailedHandler(null);
      if (channel) db.removeChannel(channel);
    };
  }, []);

  const signOut = () => void supabase!.auth.signOut();

  if (phase === "loading") return <Centered><p className="text-muted">Laden…</p></Centered>;
  if (phase === "signed-out") return <Login />;
  if (phase === "no-access" || phase === "error") {
    return (
      <Centered>
        <h1 className="font-serif text-3xl">{phase === "error" ? "Er ging iets mis" : "Nog geen toegang"}</h1>
        <p className="mt-3 text-muted">
          {phase === "error"
            ? "De gegevens konden niet worden geladen. Probeer het over een paar minuten opnieuw."
            : `Je bent ingelogd als ${email}, maar er is nog geen project aan dit adres gekoppeld. Vraag ${studio.name} om je uit te nodigen.`}
        </p>
        <Button variant="secondary" className="mt-6" onClick={signOut}>
          Uitloggen
        </Button>
      </Centered>
    );
  }

  return (
    <LiveUser.Provider value={{ email, signOut }}>
      {syncError && (
        <div role="alert" className="flex items-center justify-between gap-4 bg-warn px-4 py-2.5 text-sm text-white print:hidden">
          <span>{syncError}</span>
          <button type="button" onClick={clearSyncError} className="underline underline-offset-4">
            Sluiten
          </button>
        </div>
      )}
      {children}
    </LiveUser.Provider>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    try {
      await sendInvite(email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Centered>
      <div className="mb-8 flex flex-col items-center gap-4">
        <Logo size={64} />
        <p className="font-serif text-3xl">
          mim <span className="text-muted">|</span> interiors
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">klantportaal</p>
      </div>
      <Card className="p-6 text-left">
        {status === "sent" ? (
          <div className="space-y-2">
            <h1 className="font-serif text-2xl">Check je mail</h1>
            <p className="text-sm text-muted">
              We hebben een inloglink gestuurd naar <span className="text-foreground">{email}</span>. Klik op de link om in
              te loggen. Geen mail ontvangen? Kijk ook in je spam.
            </p>
            <button type="button" onClick={() => setStatus("idle")} className="text-sm underline underline-offset-4">
              Ander e-mailadres gebruiken
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h1 className="font-serif text-2xl">Inloggen</h1>
            <p className="text-sm text-muted">Vul je e-mailadres in. Je krijgt een link om in te loggen, een wachtwoord is niet nodig.</p>
            <label className="block text-sm">
              <span className="text-muted">E-mailadres</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} mt-1.5`}
              />
            </label>
            {status === "error" && (
              <p className="text-sm text-warn">Versturen lukte niet. Wacht een minuut en probeer het opnieuw.</p>
            )}
            <Button type="submit" className="w-full" disabled={status === "sending"}>
              {status === "sending" ? "Versturen…" : "Stuur inloglink"}
            </Button>
          </form>
        )}
      </Card>
    </Centered>
  );
}
