"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { setRole } from "@/lib/actions";
import { resetAppState, useAppState } from "@/lib/store";
import { studio } from "@/lib/studio";
import type { Role } from "@/lib/types";

const roles: { id: Role; label: string }[] = [
  { id: "architect", label: "Studio" },
  { id: "client", label: "Klant" },
];

export default function AppHeader() {
  const { role } = useAppState();

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-serif text-2xl tracking-wide">
            mim <span className="text-muted">|</span> interiors
          </span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-muted sm:inline">klantportaal</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted md:inline">Bekijk als</span>
          <div className="flex rounded-full border border-border p-0.5 text-sm" role="group" aria-label="Weergave">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                aria-pressed={role === r.id}
                className={`rounded-full px-3 py-1 ${
                  role === r.id ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Alle wijzigingen wissen en de voorbeelddata terugzetten?")) resetAppState();
            }}
            className="text-xs text-muted underline-offset-4 hover:underline"
            title={`Prototype van ${studio.name}: data staat alleen in deze browser`}
          >
            Reset demo
          </button>
        </div>
      </div>
    </header>
  );
}
