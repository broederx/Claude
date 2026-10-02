"use client";

import Link from "next/link";
import { peopleOnProject, roleLabel } from "@/lib/access";
import { briefing, clientBudget, isBlocked, noticesFor, risksFor, visibleMilestones } from "@/lib/actions";
import { euro, longDate, shortDate, today } from "@/lib/format";
import { useProjectData } from "@/lib/session";
import { Badge, Card, SectionTitle, Stat } from "@/components/ui";

export default function Overview({ projectId }: { projectId: string }) {
  const { state, user, project, scoped } = useProjectData(projectId);
  const base = `/projecten/${projectId}`;
  const notices = noticesFor(state, user).filter((n) => n.projectId === projectId);
  const milestones = visibleMilestones(user, state, projectId).filter((m) => !m.done && m.date >= today()).slice(0, 4);
  const people = peopleOnProject(state, user, projectId).filter((u) => u.id !== user.id);
  const budget = clientBudget(state, project);

  const todo = (
    <Card className="p-5">
      <SectionTitle>{user.role === "owner" ? "Lopende acties" : "Wat we van je nodig hebben"}</SectionTitle>
      {notices.length === 0 ? (
        <p className="text-sm text-muted">Niets openstaand.</p>
      ) : (
        <ul className="divide-y divide-border">
          {notices.map((n, i) => (
            <li key={i}>
              <Link href={`${base}/${n.tab}`} className="flex justify-between gap-4 py-2.5 text-sm hover:text-accent">
                {n.text} <span className="text-muted">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  const planning = (
    <Card className="p-5">
      <SectionTitle aside={<Link href={`${base}/planning`} className="text-xs text-muted hover:underline">Hele planning</Link>}>Binnenkort</SectionTitle>
      {milestones.length === 0 ? (
        <p className="text-sm text-muted">Niets gepland.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {milestones.map((m) => (
            <li key={m.id} className="flex gap-3">
              <span className="w-16 shrink-0 tabular-nums text-muted">{shortDate(m.date)}</span>
              {m.title}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  const contacts = (
    <Card className="p-5">
      <SectionTitle>Betrokken</SectionTitle>
      <ul className="space-y-2 text-sm">
        {people.map((u) => (
          <li key={u.id}>
            <p>{u.company && u.role !== "owner" ? u.company : u.name}</p>
            <p className="text-xs text-muted">
              {u.role === "contractor" ? u.trade : roleLabel[u.role]}
              {u.role === "owner" || user.role === "owner" ? ` · ${u.email}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );

  if (user.role === "contractor") {
    const mine = scoped(state.tasks).filter((t) => t.assigneeId === user.id).sort((a, b) => a.start.localeCompare(b.start));
    const agreement = state.agreements.find((a) => a.projectId === projectId && a.contractorId === user.id);
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <SectionTitle aside={<Link href={`${base}/taken`} className="text-xs text-muted hover:underline">Alle taken</Link>}>Mijn werk hier</SectionTitle>
            <ul className="divide-y divide-border text-sm">
              {mine.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span>{t.title}</span>
                  <span className="flex items-center gap-2 text-muted">
                    {shortDate(t.start)}–{shortDate(t.due)}
                    {t.status === "klaar" ? <Badge tone="sage">Klaar</Badge> : isBlocked(t, state.tasks) ? <Badge tone="warn">Wacht</Badge> : <Badge tone="accent">Kan starten</Badge>}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          {todo}
        </div>
        <div className="space-y-6">
          <Card className="p-5 text-sm">
            <SectionTitle>Opdracht</SectionTitle>
            <p>{agreement?.scope}</p>
            <p className="mt-2 text-muted">Locatie: {project.address}</p>
            {user.accessUntil && <p className="mt-2 text-muted">Je toegang loopt tot {longDate(user.accessUntil)}.</p>}
          </Card>
          {planning}
          {contacts}
        </div>
      </div>
    );
  }

  const risks = user.role === "owner" ? risksFor(state, project) : [];
  const summary = briefing(project);
  const decisions = scoped(state.decisions).slice(-3).reverse();

  return (
    <div className="space-y-6">
      {(user.role === "owner" || project.showBudgetToClient) && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Budget" value={euro(budget.total)} />
          <Stat label="Besteed" value={euro(budget.spent)} />
          <Stat label="Nog beschikbaar" value={euro(budget.remaining)} tone={budget.remaining < 0 ? "warn" : undefined} />
          <Stat label="Openstaande keuzes" value={budget.openChoices} />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {user.role === "owner" && (
            <Card className="p-5">
              <SectionTitle>Risico&apos;s en blokkades</SectionTitle>
              {risks.length === 0 ? (
                <p className="text-sm text-muted">Geen risico&apos;s gesignaleerd.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {risks.map((r, i) => (
                    <li key={i}>
                      <Link href={`${base}/${r.tab}`} className="flex gap-2.5 hover:underline">
                        <Badge tone={r.level === "hoog" ? "warn" : "accent"}>{r.level}</Badge>
                        {r.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
          {todo}
          {summary && (
            <Card className="p-5">
              <SectionTitle aside={<Link href={`${base}/intake`} className="text-xs text-muted hover:underline">Intake</Link>}>Projectbriefing</SectionTitle>
              <p className="font-serif text-xl leading-snug">{summary}</p>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          {planning}
          <Card className="p-5">
            <SectionTitle aside={<Link href={`${base}/besluiten`} className="text-xs text-muted hover:underline">Logboek</Link>}>Laatste besluiten</SectionTitle>
            {decisions.length === 0 ? (
              <p className="text-sm text-muted">Nog geen besluiten.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {decisions.map((d) => (
                  <li key={d.id}>
                    <p>
                      <span className="font-medium">{d.subject}</span> · {d.detail}
                    </p>
                    <p className="text-xs text-muted">
                      {shortDate(d.at)}
                      {d.consequence ? ` · ${d.consequence}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {contacts}
        </div>
      </div>
    </div>
  );
}
