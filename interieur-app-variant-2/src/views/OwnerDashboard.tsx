"use client";

import Link from "next/link";
import { clientBudget, noticesFor, risksFor, visibleMilestones } from "@/lib/actions";
import { euro, shortDate, today } from "@/lib/format";
import { phaseIndex, phases } from "@/lib/labels";
import { useSession } from "@/lib/session";
import { studio } from "@/lib/studio";
import type { Project } from "@/lib/types";
import { Badge, Card, Stat } from "@/components/ui";

export default function OwnerDashboard() {
  const { state, user, projects } = useSession();
  const active = projects.filter((p) => p.phase !== "oplevering");
  const allRisks = projects.flatMap((p) => risksFor(state, p));
  const openChoices = state.choices.filter((c) => !c.chosenOptionId).length;
  const awaiting = state.files.filter((f) => f.versions.some((v) => v.status === "ter-akkoord")).length;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-muted">{studio.tagline}</p>
        <h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Goedendag, {user.name.split(" ")[0]}</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Alles wat anders in WhatsApp, mail, WeTransfer, Excel en je hoofd staat, per project op één plek.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Actieve projecten" value={active.length} />
        <Stat label="Risico's en blokkades" value={allRisks.length} tone={allRisks.some((r) => r.level === "hoog") ? "warn" : undefined} />
        <Stat label="Openstaande keuzes" value={openChoices} />
        <Stat label="Akkoord nodig" value={awaiting} />
      </div>

      <div className="space-y-6">
        {projects.map((p) => (
          <ProjectPanel key={p.id} project={p} />
        ))}
      </div>

      {noticesFor(state, user).length > 0 && (
        <p className="text-sm text-muted">
          <Link href="/meldingen" className="underline underline-offset-4">
            Bekijk alle {noticesFor(state, user).length} meldingen
          </Link>
        </p>
      )}
    </div>
  );
}

function ProjectPanel({ project: p }: { project: Project }) {
  const { state, user } = useSession();
  const base = `/projecten/${p.id}`;
  const client = state.users.find((u) => u.id === p.clientId);
  const index = phaseIndex(p.phase);
  const risks = risksFor(state, p);
  const budget = clientBudget(state, p);
  const pct = Math.min(100, Math.round((budget.spent / p.budget) * 100));
  const upcoming = visibleMilestones(user, state, p.id).filter((m) => !m.done && m.date >= today()).slice(0, 3);
  const choices = state.choices.filter((c) => c.projectId === p.id && !c.chosenOptionId).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const actions = noticesFor(state, user).filter((n) => n.projectId === p.id).slice(0, 4);
  const messages = state.comments.filter((c) => c.projectId === p.id).slice(-2).reverse();
  const awaiting = state.files.filter((f) => f.projectId === p.id && f.versions.some((v) => v.status === "ter-akkoord"));
  const nameOf = (id: string) => state.users.find((u) => u.id === id)?.name.split(" ")[0] ?? "";

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-xl sm:flex">
            {p.coverColors.map((c) => (
              <span key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <div>
            <Link href={base} className="font-serif text-2xl hover:underline">
              {p.name}
            </Link>
            <p className="text-sm text-muted">
              {client?.company ?? client?.name} · {p.address}
            </p>
          </div>
        </div>
        <ol className="flex gap-1" aria-label={`Status: ${phases[index].label}`}>
          {phases.map((ph, i) => (
            <li
              key={ph.id}
              className={`rounded-full px-2.5 py-1 text-xs ${
                i === index ? "bg-foreground text-background" : i < index ? "bg-stone/60 text-foreground/70" : "border border-border text-muted"
              }`}
            >
              {ph.label}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Block title="Risico's en blokkades" href={base}>
          {risks.length === 0 ? (
            <p className="text-muted">Geen</p>
          ) : (
            risks.slice(0, 3).map((r, i) => (
              <Link key={i} href={`${base}/${r.tab}`} className="flex gap-2 hover:underline">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.level === "hoog" ? "bg-warn" : "bg-accent"}`} aria-hidden />
                {r.text}
              </Link>
            ))
          )}
        </Block>
        <Block title="Lopende acties" href="/meldingen">
          {actions.length === 0 ? <p className="text-muted">Niets voor jou</p> : actions.map((a, i) => (
            <Link key={i} href={`${base}/${a.tab}`} className="block hover:underline">
              {a.text}
            </Link>
          ))}
        </Block>
        <Block title="Planning" href={`${base}/planning`}>
          {upcoming.length === 0 ? <p className="text-muted">Niets gepland</p> : upcoming.map((m) => (
            <p key={m.id}>
              <span className="tabular-nums text-muted">{shortDate(m.date)}</span> {m.title}
            </p>
          ))}
        </Block>
        <Block title="Budgetstatus" href={`${base}/budget`}>
          <p className="tabular-nums">
            {euro(budget.spent)} <span className="text-muted">van {euro(p.budget)}</span>
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div className={`h-full ${budget.remaining < 0 ? "bg-warn" : "bg-sage"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-muted">
            {budget.pendingMeerwerk ? `${euro(budget.pendingMeerwerk)} meerwerk in afwachting` : `${euro(budget.remaining)} beschikbaar`}
          </p>
        </Block>
        <Block title="Openstaande keuzes" href={`${base}/ontwerp`}>
          {choices.length === 0 ? <p className="text-muted">Geen</p> : choices.slice(0, 3).map((c) => (
            <p key={c.id}>
              {c.question}{" "}
              <span className={c.deadline < today() ? "text-warn" : "text-muted"}>vóór {shortDate(c.deadline)}</span>
            </p>
          ))}
        </Block>
        <Block title="Akkoord nodig" href={`${base}/bestanden`}>
          {awaiting.length === 0 ? <p className="text-muted">Geen</p> : awaiting.map((f) => (
            <p key={f.id}>
              {f.title} <Badge tone="accent">v{f.versions.find((v) => v.status === "ter-akkoord")?.version}</Badge>
            </p>
          ))}
        </Block>
        <Block title="Laatste berichten" href={`${base}/communicatie`} wide>
          {messages.length === 0 ? <p className="text-muted">Nog geen berichten</p> : messages.map((m) => (
            <p key={m.id} className="line-clamp-2">
              <span className="font-medium">{nameOf(m.authorId)}:</span> {m.text}
            </p>
          ))}
        </Block>
      </div>
    </Card>
  );
}

function Block({ title, href, children, wide }: { title: string; href: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 space-y-2 bg-surface p-4 text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <Link href={href} className="block text-[11px] uppercase tracking-[0.18em] text-muted hover:text-foreground">
        {title}
      </Link>
      {children}
    </div>
  );
}
