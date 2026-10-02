"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { accessExpired, roleLabel } from "@/lib/access";
import { noticesFor, setCurrentUser } from "@/lib/actions";
import { useSession } from "@/lib/session";
import { resetAppState } from "@/lib/store";
import type { Role } from "@/lib/types";
import Logo from "@/components/Logo";

const navByRole: Record<Role, { href: string; label: string }[]> = {
  owner: [
    { href: "/", label: "Dashboard" },
    { href: "/projecten", label: "Projecten" },
    { href: "/taken", label: "Taken" },
    { href: "/producten", label: "Producten" },
    { href: "/mensen", label: "Klanten & toegang" },
    { href: "/meldingen", label: "Meldingen" },
    { href: "/audit", label: "Auditlog" },
    { href: "/rechten", label: "Rollen & rechten" },
  ],
  client: [
    { href: "/", label: "Mijn project" },
    { href: "/meldingen", label: "Meldingen" },
  ],
  contractor: [
    { href: "/", label: "Mijn werk" },
    { href: "/meldingen", label: "Meldingen" },
  ],
  supplier: [
    { href: "/", label: "Aanvragen" },
    { href: "/meldingen", label: "Meldingen" },
  ],
};

export default function Shell({ children }: { children: ReactNode }) {
  const { state, user } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const count = noticesFor(state, user).length;
  const nav = navByRole[user.role];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || (user.role !== "owner" && pathname.startsWith("/projecten")) : pathname.startsWith(href);

  const sidebar = (
    <div className="flex h-full flex-col gap-8">
      <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
        <Logo size={36} />
        <span className="font-serif text-xl tracking-wide">
          mim <span className="text-muted">|</span> interiors
        </span>
      </Link>

      <nav aria-label="Hoofdmenu">
        <ul className="space-y-0.5">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                  isActive(item.href) ? "bg-foreground text-background" : "text-foreground/75 hover:bg-stone/40"
                }`}
              >
                {item.label}
                {item.href === "/meldingen" && count > 0 && (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] ${
                      isActive(item.href) ? "bg-background text-foreground" : "bg-accent text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto space-y-3 rounded-2xl border border-dashed border-border p-3 text-xs">
        <p className="uppercase tracking-[0.15em] text-muted">Demo: ingelogd als</p>
        <select
          value={user.id}
          onChange={(e) => {
            setCurrentUser(e.target.value);
            setMenuOpen(false);
            router.push("/");
          }}
          aria-label="Ingelogd als"
          className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
        >
          {(["owner", "client", "contractor", "supplier"] as Role[]).map((role) => (
            <optgroup key={role} label={roleLabel[role]}>
              {state.users
                .filter((u) => u.role === role)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.company && u.role !== "owner" ? `${u.company} (${u.name})` : u.name}
                    {accessExpired(u) ? " · verlopen" : ""}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <p className="text-muted">
          {roleLabel[user.role]}
          {user.twoFactor ? " · tweestapsverificatie aan" : ""}
        </p>
        {confirmReset ? (
          <span className="flex gap-3">
            <button type="button" className="text-warn underline" onClick={() => { resetAppState(); setConfirmReset(false); }}>
              Ja, alles terugzetten
            </button>
            <button type="button" className="text-muted" onClick={() => setConfirmReset(false)}>
              Nee
            </button>
          </span>
        ) : (
          <button type="button" className="text-muted underline-offset-4 hover:underline" onClick={() => setConfirmReset(true)}>
            Reset demo
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-full lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface px-5 py-6 lg:sticky lg:top-0 lg:block lg:h-screen">
        {sidebar}
      </aside>

      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-serif text-lg">mim | interiors</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm"
        >
          Menu
          {count > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] text-white">{count}</span>}
        </button>
      </div>
      {menuOpen && <div className="border-b border-border bg-surface px-4 py-5 lg:hidden">{sidebar}</div>}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
