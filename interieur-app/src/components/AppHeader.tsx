"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { setContractorView, setRole } from "@/lib/actions";
import { resetAppState, useAppState } from "@/lib/store";
import { studio } from "@/lib/studio";
import type { Role } from "@/lib/types";

const roles: { id: Role; label: string }[] = [
  { id: "architect", label: "Studio" },
  { id: "client", label: "Klant" },
  { id: "contractor", label: "Uitvoerder" },
];

export default function AppHeader() {
  const { role, contractors, contractorView } = useAppState();
  const [confirmReset, setConfirmReset] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const nav = [
    { href: "/", label: "Projecten", active: pathname === "/" || pathname.startsWith("/projecten") },
    { href: "/leveranciers", label: "Leveranciers", active: pathname.startsWith("/leveranciers") },
    { href: "/uitvoerders", label: "Uitvoerders", active: pathname.startsWith("/uitvoerders") },
  ];

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-serif text-2xl tracking-wide">
            mim <span className="text-muted">|</span> interiors
          </span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-muted sm:inline">
            {role === "contractor" ? "uitvoerders" : role === "client" ? "klantportaal" : "studio"}
          </span>
        </Link>

        {role === "architect" && (
          <nav aria-label="Hoofdmenu" className="order-last flex w-full gap-6 text-sm md:order-none md:w-auto">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={item.active ? "text-foreground" : "text-muted hover:text-foreground"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <span className="hidden text-xs text-muted md:inline">Bekijk als</span>
          <div className="flex rounded-full border border-border p-0.5 text-sm" role="group" aria-label="Weergave">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id);
                  // Uitvoerders hebben alleen hun eigen documentenoverzicht.
                  if (r.id === "contractor") router.push("/");
                }}
                aria-pressed={role === r.id}
                className={`rounded-full px-3 py-1 ${
                  role === r.id ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {role === "contractor" && (
            <select
              value={contractorView}
              onChange={(e) => setContractorView(e.target.value)}
              aria-label="Ingelogd als uitvoerder"
              className="rounded-full border border-border bg-surface px-2 py-1 text-sm"
            >
              {contractors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          {confirmReset ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-muted">Alles wissen?</span>
              <button
                type="button"
                onClick={() => {
                  resetAppState();
                  setConfirmReset(false);
                }}
                className="text-warn underline underline-offset-4"
              >
                Ja, reset
              </button>
              <button type="button" onClick={() => setConfirmReset(false)} className="text-muted hover:text-foreground">
                Nee
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-xs text-muted underline-offset-4 hover:underline"
              title={`Prototype van ${studio.name}: data staat alleen in deze browser`}
            >
              Reset demo
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
