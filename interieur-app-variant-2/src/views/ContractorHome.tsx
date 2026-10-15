"use client";

import Link from "next/link";
import { isBlocked, noticesFor, setTaskStatus } from "@/lib/actions";
import { longDate, shortDate, today } from "@/lib/format";
import { useSession } from "@/lib/session";
import { studio } from "@/lib/studio";
import { Badge, Button, Card, Empty, SectionTitle } from "@/components/ui";

// "Mijn werk": mobiel eerst. Taken van alle projecten waar deze uitvoerder aan werkt.
export default function ContractorHome() {
  const { state, user, projects } = useSession();
  const tasks = state.tasks
    .filter((t) => t.assigneeId === user.id && projects.some((p) => p.id === t.projectId) && t.status !== "klaar")
    .sort((a, b) => a.start.localeCompare(b.start));
  const notices = noticesFor(state, user);
  const now = today();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-muted">Uitvoerders · {studio.name}</p>
        <h1 className="mt-2 font-serif text-4xl font-light">Mijn werk</h1>
        <p className="mt-2 text-muted">
          {user.company} · {user.trade}
          {user.accessUntil && ` · toegang tot ${longDate(user.accessUntil)}`}
        </p>
      </header>

      {notices.length > 0 && (
        <Card className="p-4">
          <SectionTitle>Voor jou</SectionTitle>
          <ul className="divide-y divide-border text-sm">
            {notices.map((n, i) => (
              <li key={i}>
                <Link href={`/projecten/${n.projectId}/${n.tab}`} className="flex justify-between gap-3 py-2.5 hover:text-accent">
                  {n.text} <span className="text-muted">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section>
        <SectionTitle>Openstaande taken</SectionTitle>
        {tasks.length === 0 ? (
          <Empty>Geen openstaande taken.</Empty>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => {
              const project = projects.find((p) => p.id === t.projectId)!;
              const blocked = isBlocked(t, state.tasks);
              const waitingFor = t.dependsOn.map((id) => state.tasks.find((x) => x.id === id)).filter((x) => x && x.status !== "klaar");
              return (
                <Card key={t.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted">
                        {project.name} · {project.address}
                      </p>
                      <p className="text-lg font-medium">{t.title}</p>
                      <p className="text-sm tabular-nums text-muted">
                        {shortDate(t.start)} – {shortDate(t.due)}
                        {t.location && ` · ${t.location}`}
                      </p>
                      {blocked && (
                        <p className="mt-1 text-sm text-warn">Wacht op: {waitingFor.map((w) => w!.title).join(", ")}</p>
                      )}
                    </div>
                    {blocked ? <Badge tone="warn">Wacht</Badge> : t.start <= now ? <Badge tone="accent">{t.status === "bezig" ? "Bezig" : "Kan starten"}</Badge> : <Badge>Gepland</Badge>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!blocked && t.status === "open" && <Button variant="secondary" onClick={() => setTaskStatus(user, t, "bezig")}>Start</Button>}
                    {!blocked && <Button onClick={() => setTaskStatus(user, t, "klaar")}>Klaar</Button>}
                    <Link href={`/projecten/${t.projectId}/taken`} className="rounded-full border border-border px-4 py-2 text-sm">
                      Foto, vraag of probleem
                    </Link>
                    <Link href={`/projecten/${t.projectId}/bestanden`} className="rounded-full border border-border px-4 py-2 text-sm">
                      Tekeningen
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Projecten</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/projecten/${p.id}`}>
              <Card className="p-4 hover:shadow-lg hover:shadow-foreground/5">
                <p className="font-serif text-xl">{p.name}</p>
                <p className="text-sm text-muted">{p.address}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
