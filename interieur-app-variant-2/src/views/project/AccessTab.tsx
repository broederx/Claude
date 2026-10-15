"use client";

import { accessExpired, roleLabel } from "@/lib/access";
import { audit, patchItem } from "@/lib/actions";
import { longDate, shortDate, time } from "@/lib/format";
import { useProjectData } from "@/lib/session";
import type { User } from "@/lib/types";
import { Badge, Button, Card, PageHeader, SectionTitle } from "@/components/ui";
import InviteForm from "@/components/InviteForm";

// Wie heeft toegang tot dit project, tot wanneer, en wat deed iemand.
export default function AccessTab({ projectId }: { projectId: string }) {
  const { state, user, project } = useProjectData(projectId);
  const members = state.users.filter((u) => u.role !== "owner" && u.projectIds.includes(projectId));
  const others = state.users.filter((u) => (u.role === "contractor" || u.role === "supplier") && !u.projectIds.includes(projectId));
  const log = state.audit.filter((a) => a.projectId === projectId).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  const nameOf = (id: string) => state.users.find((u) => u.id === id)?.name ?? "";

  function remove(u: User) {
    patchItem("users", u.id, { projectIds: u.projectIds.filter((id) => id !== projectId) });
    audit(user, "toegang ingetrokken", `${u.company ?? u.name} van ${project.name}`, projectId);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Toegang" intro="Alleen wie hier staat, weet dat dit project bestaat. Uitvoerders krijgen toegang tot een einddatum; daarna gaat het project automatisch dicht." />
      <Card className="divide-y divide-border">
        {members.map((u) => (
          <div key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{u.company && u.role !== "client" ? `${u.company} · ${u.name}` : u.name}</p>
              <p className="text-xs text-muted">
                {u.role === "contractor" ? u.trade : roleLabel[u.role]} · {u.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {u.twoFactor ? <Badge tone="sage">2FA aan</Badge> : <Badge>2FA uit</Badge>}
              {u.role === "contractor" && (
                <label className="flex items-center gap-2 text-xs text-muted">
                  Toegang tot
                  <input
                    type="date"
                    value={u.accessUntil ?? ""}
                    onChange={(e) => { patchItem("users", u.id, { accessUntil: e.target.value || undefined }); audit(user, "aangepast", `Einddatum toegang ${u.company}`, projectId); }}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-foreground"
                  />
                </label>
              )}
              {accessExpired(u) && <Badge tone="warn">Verlopen</Badge>}
              {u.role !== "client" && (
                <Button variant="ghost" onClick={() => remove(u)}>Toegang intrekken</Button>
              )}
            </div>
          </div>
        ))}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>Uitvoerder of leverancier toevoegen</SectionTitle>
          {others.length > 0 && (
            <ul className="mb-4 space-y-2 text-sm">
              {others.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2">
                  <span>{u.company} <span className="text-muted">· {u.trade ?? roleLabel[u.role]}</span></span>
                  <Button
                    variant="secondary"
                    onClick={() => { patchItem("users", u.id, { projectIds: [...u.projectIds, projectId] }); audit(user, "uitgenodigd", `${u.company} voor ${project.name}`, projectId); }}
                  >
                    Toevoegen
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <InviteForm projectId={projectId} defaultUntil={project.deliveryDate} />
        </Card>
        <Card className="p-5">
          <SectionTitle>Recente activiteit in dit project</SectionTitle>
          <ul className="space-y-2 text-sm">
            {log.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="w-24 shrink-0 tabular-nums text-xs text-muted">{shortDate(a.at)} {time(a.at)}</span>
                <span>
                  {nameOf(a.userId)} {a.action} <span className="text-muted">{a.target}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Oplevering {longDate(project.deliveryDate)}. Standaard eindigt toegang van uitvoerders 30 dagen daarna.</p>
        </Card>
      </div>
    </div>
  );
}
