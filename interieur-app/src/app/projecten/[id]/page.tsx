"use client";

import Link from "next/link";
import { openActions, patchItem } from "@/lib/actions";
import { euro, invoiceTotals, longDate, phaseIndex, phases, today } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import type { Phase } from "@/lib/types";
import { Card } from "@/components/ui";

export default function ProjectOverview() {
  const { project, state, role, scoped } = useProject();
  if (!project) return null;

  const index = phaseIndex(project.phase);
  const actions = openActions(state, role, project.id);
  const products = scoped(state.products).filter((p) => p.status !== "afgewezen");
  const committed = products.reduce((sum, p) => sum + p.price * p.qty, 0);
  const invoices = scoped(state.invoices).filter((i) => i.kind === "factuur");
  const paid = invoices.filter((i) => i.status === "betaald").reduce((s, i) => s + invoiceTotals(i).total, 0);
  const upcoming = scoped(state.milestones)
    .filter((m) => !m.done && m.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  const base = `/projecten/${project.id}`;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <Card className="p-6">
          <h2 className="mb-6 text-xs uppercase tracking-[0.2em] text-muted">Waar staan we</h2>
          <ol className="space-y-4">
            {phases.map((phase, i) => (
              <li key={phase.id} className="flex gap-4">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                    i < index
                      ? "border-accent bg-accent text-white"
                      : i === index
                        ? "border-accent text-accent"
                        : "border-border text-muted"
                  }`}
                >
                  {i < index ? "✓" : i + 1}
                </span>
                <div className={i > index ? "text-muted" : ""}>
                  <p className={i === index ? "font-medium" : ""}>{phase.label}</p>
                  <p className="text-sm text-muted">{phase.description}</p>
                </div>
              </li>
            ))}
          </ol>
          {role === "architect" && (
            <label className="mt-6 flex items-center gap-3 border-t border-border pt-4 text-sm text-muted">
              Fase aanpassen
              <select
                value={project.phase}
                onChange={(e) => patchItem("projects", project.id, { phase: e.target.value as Phase })}
                className="rounded-lg border border-border bg-background px-2 py-1 text-foreground"
              >
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">
            {role === "client" ? "Wacht op jouw reactie" : "Actiepunten voor de studio"}
          </h2>
          {actions.length === 0 ? (
            <p className="text-sm text-muted">Niets openstaand.</p>
          ) : (
            <ul className="space-y-2">
              {actions.map((a, i) => (
                <li key={`${a.href}-${i}`}>
                  <Link href={a.href} className="flex justify-between text-sm hover:text-accent">
                    {a.label} <span className="text-muted">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="p-6">
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">Budget inrichting</h2>
          <p className="font-serif text-3xl">{euro(committed)}</p>
          <p className="text-sm text-muted">van {euro(project.budget)} gepland in producten</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full ${committed > project.budget ? "bg-warn" : "bg-sage"}`}
              style={{ width: `${Math.min(100, (committed / project.budget) * 100)}%` }}
            />
          </div>
          <Link href={`${base}/producten`} className="mt-4 inline-block text-sm underline underline-offset-4">
            Naar producten
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">Binnenkort</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Geen geplande afspraken.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {upcoming.map((m) => (
                <li key={m.id}>
                  <p>{m.title}</p>
                  <p className="text-muted">
                    {longDate(m.date)}
                    {m.location && ` · ${m.location}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">Honorarium</h2>
          <p className="text-sm">
            {euro(paid)} betaald · {invoices.filter((i) => i.status === "verzonden").length} openstaand
          </p>
          <Link href={`${base}/financien`} className="mt-4 inline-block text-sm underline underline-offset-4">
            Naar offertes &amp; facturen
          </Link>
        </Card>
      </div>
    </div>
  );
}
