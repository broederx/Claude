"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { accessExpired, permissionMatrix, roleLabel } from "@/lib/access";
import { addItem, audit, clientBudget, isBlocked, noticesFor, patchItem, risksFor } from "@/lib/actions";
import { euro, longDate, newId, shortDate, time } from "@/lib/format";
import { phaseIndex, phases, productStatus } from "@/lib/labels";
import { useSession } from "@/lib/session";
import type { Role } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, PageHeader, SectionTitle, Toggle, inputClass } from "@/components/ui";
import InviteForm from "@/components/InviteForm";

export function ProjectsPage() {
  const { state, projects } = useSession();
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <PageHeader title="Projecten" action={!adding && <Button onClick={() => setAdding(true)}>+ Nieuw project</Button>} />
      {adding && <NewProject onDone={() => setAdding(false)} />}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const client = state.users.find((u) => u.id === p.clientId);
          const risks = risksFor(state, p);
          const b = clientBudget(state, p);
          return (
            <Link key={p.id} href={`/projecten/${p.id}`} className="group">
              <Card className="overflow-hidden group-hover:shadow-lg group-hover:shadow-foreground/5">
                <div className="flex h-20">
                  {p.coverColors.map((c) => (
                    <span key={c} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
                <div className="space-y-2 p-4">
                  <p className="font-serif text-2xl">{p.name}</p>
                  <p className="text-sm text-muted">{client?.company ?? client?.name}</p>
                  <div className="flex gap-1" aria-hidden>
                    {phases.map((ph, i) => (
                      <span key={ph.id} className={`h-1 flex-1 rounded-full ${i <= phaseIndex(p.phase) ? "bg-accent" : "bg-border"}`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <Badge tone="accent">{phases[phaseIndex(p.phase)].label}</Badge>
                    <span className="tabular-nums text-muted">{euro(b.spent)} / {euro(p.budget)}</span>
                  </div>
                  {risks.length > 0 && <p className="text-xs text-warn">{risks.length} risico{risks.length > 1 ? "'s" : ""}</p>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NewProject({ onDone }: { onDone: () => void }) {
  const { state, user } = useSession();
  const clients = state.users.filter((u) => u.role === "client");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    const name = String(d.get("name"));
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${newId().slice(0, 4)}`;
    const clientId = String(d.get("clientId"));
    const rooms = String(d.get("rooms")).split(",").map((r) => r.trim()).filter(Boolean);
    addItem("projects", {
      id,
      name,
      clientId,
      address: String(d.get("address")),
      phase: "intake",
      budget: Number(d.get("budget")) || 0,
      showBudgetToClient: true,
      startDate: new Date().toISOString().slice(0, 10),
      deliveryDate: String(d.get("deliveryDate")),
      rooms: rooms.length ? rooms : ["Woonkamer"],
      coverColors: ["#e2d8c9", "#b5a38c", "#57534a"],
      intake: { ruimtes: rooms },
      internal: { hourlyRate: 95, hoursBudget: 120, hoursSpent: 0, bufferPct: 10 },
    });
    const client = state.users.find((u) => u.id === clientId);
    if (client) patchItem("users", clientId, { projectIds: [...client.projectIds, id] });
    audit(user, "aangepast", `Project aangemaakt: ${name}`, id);
    onDone();
  }

  return (
    <Card className="mb-6 p-5">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field label="Projectnaam">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Klant">
          <select name="clientId" className={inputClass}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.company ?? c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Adres">
          <input name="address" className={inputClass} />
        </Field>
        <Field label="Budget (€)">
          <input name="budget" type="number" min="0" step="1000" className={inputClass} />
        </Field>
        <Field label="Gewenste oplevering">
          <input name="deliveryDate" type="date" required className={inputClass} />
        </Field>
        <Field label="Ruimtes (komma's ertussen)">
          <input name="rooms" className={inputClass} />
        </Field>
        <div className="flex gap-3">
          <Button type="submit">Aanmaken</Button>
          <Button variant="ghost" onClick={onDone}>Annuleren</Button>
        </div>
      </form>
      <p className="mt-3 text-xs text-muted">Nieuwe klant? Nodig die eerst uit via Klanten &amp; toegang.</p>
    </Card>
  );
}

export function PeoplePage() {
  const { state, user } = useSession();
  const groups: Role[] = ["client", "contractor", "supplier"];
  const projectName = (id: string) => state.projects.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="space-y-8">
      <PageHeader title="Klanten & toegang" intro="Iedereen krijgt een persoonlijke uitnodiging en ziet alleen de projecten waaraan hij of zij gekoppeld is. Geen openbare links." />
      {groups.map((role) => (
        <section key={role}>
          <SectionTitle>{roleLabel[role]}s</SectionTitle>
          <Card className="divide-y divide-border">
            {state.users.filter((u) => u.role === role).map((u) => (
              <div key={u.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{u.company && role !== "client" ? `${u.company} · ${u.name}` : u.name}</p>
                  <p className="text-xs text-muted">
                    {u.trade ? `${u.trade} · ` : ""}
                    {u.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {u.projectIds.map((id) => (
                    <Badge key={id}>{projectName(id)}</Badge>
                  ))}
                  {u.accessUntil && (
                    <span className={`text-xs ${accessExpired(u) ? "text-warn" : "text-muted"}`}>
                      {accessExpired(u) ? "Verlopen" : "Toegang tot"} {longDate(u.accessUntil)}
                    </span>
                  )}
                  <Toggle
                    label="2FA"
                    checked={u.twoFactor}
                    onChange={(v) => { patchItem("users", u.id, { twoFactor: v }); audit(user, "aangepast", `2FA ${v ? "aan" : "uit"} voor ${u.name}`); }}
                  />
                </div>
              </div>
            ))}
          </Card>
        </section>
      ))}
      <Card className="p-5">
        <SectionTitle>Iemand uitnodigen</SectionTitle>
        <InviteForm />
      </Card>
      <p className="text-sm text-muted">Tweestapsverificatie is voor de studio altijd verplicht.</p>
    </div>
  );
}

export function AllTasksPage() {
  const { state } = useSession();
  const tasks = [...state.tasks].sort((a, b) => a.start.localeCompare(b.start));
  return (
    <div>
      <PageHeader title="Taken" intro="Alle taken van alle projecten, met wie wacht op wie." />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-[0.12em] text-muted">
              <th className="px-4 py-3 font-normal">Taak</th>
              <th className="px-4 py-3 font-normal">Project</th>
              <th className="px-4 py-3 font-normal">Uitvoerder</th>
              <th className="px-4 py-3 font-normal">Periode</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const blocked = t.status !== "klaar" && isBlocked(t, state.tasks);
              return (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/projecten/${t.projectId}/taken`} className="hover:underline">{t.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{state.projects.find((p) => p.id === t.projectId)?.name}</td>
                  <td className="px-4 py-3">{state.users.find((u) => u.id === t.assigneeId)?.company ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{shortDate(t.start)} – {shortDate(t.due)}</td>
                  <td className="px-4 py-3">
                    {t.status === "klaar" ? <Badge tone="sage">Klaar</Badge> : blocked ? <Badge tone="warn">Wacht</Badge> : <Badge tone="accent">{t.status === "bezig" ? "Bezig" : "Open"}</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function ProductsLibraryPage() {
  const { state } = useSession();
  return (
    <div>
      <PageHeader title="Producten" intro="De centrale productbibliotheek over alle projecten. Per regel zie je wie het product ziet." />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-[0.12em] text-muted">
              <th className="px-4 py-3 font-normal">Product</th>
              <th className="px-4 py-3 font-normal">Ruimte</th>
              <th className="px-4 py-3 font-normal">Leverancier</th>
              <th className="px-4 py-3 text-right font-normal">Verkoop</th>
              <th className="px-4 py-3 text-right font-normal">Inkoop</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Klant</th>
              <th className="px-4 py-3 font-normal">Uitvoerder</th>
            </tr>
          </thead>
          <tbody>
            {state.products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/projecten/${p.projectId}/producten`} className="hover:underline">{p.name}</Link>
                  <span className="block text-xs text-muted">{p.brand} · {p.sku} · {state.projects.find((x) => x.id === p.projectId)?.name}</span>
                </td>
                <td className="px-4 py-3">{p.room}</td>
                <td className="px-4 py-3">{p.supplierName}</td>
                <td className="px-4 py-3 text-right tabular-nums">{euro(p.price)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted">{euro(p.purchasePrice)}</td>
                <td className="px-4 py-3"><Badge tone={productStatus[p.status].tone}>{productStatus[p.status].label}</Badge></td>
                <td className="px-4 py-3"><input type="checkbox" aria-label={`${p.name} zichtbaar voor klant`} checked={p.visibleToClient} onChange={(e) => patchItem("products", p.id, { visibleToClient: e.target.checked })} /></td>
                <td className="px-4 py-3"><input type="checkbox" aria-label={`${p.name} zichtbaar voor uitvoerder`} checked={p.visibleToContractor} onChange={(e) => patchItem("products", p.id, { visibleToContractor: e.target.checked })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-muted">Inkoopprijs en marge zijn nooit zichtbaar buiten de studio, ongeacht deze vinkjes.</p>
    </div>
  );
}

export function AuditPage() {
  const { state } = useSession();
  const [who, setWho] = useState("");
  const entries = [...state.audit].filter((a) => !who || a.userId === who).sort((a, b) => b.at.localeCompare(a.at));
  const nameOf = (id: string) => state.users.find((u) => u.id === id)?.name ?? id;
  return (
    <div>
      <PageHeader
        title="Auditlog"
        intro="Wie heeft wat bekeken, aangepast, goedgekeurd of verwijderd, en wanneer. Niet aan te passen."
        action={
          <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter op persoon" className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm">
            <option value="">Iedereen</option>
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        }
      />
      {entries.length === 0 ? (
        <Empty>Geen activiteit.</Empty>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <tbody>
              {entries.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-muted">{shortDate(a.at)} {time(a.at)}</td>
                  <td className="px-4 py-2.5">{nameOf(a.userId)}</td>
                  <td className="px-4 py-2.5"><Badge tone={a.action === "goedgekeurd" ? "sage" : a.action === "verwijderd" || a.action === "toegang ingetrokken" ? "warn" : "neutral"}>{a.action}</Badge></td>
                  <td className="px-4 py-2.5">{a.target}</td>
                  <td className="px-4 py-2.5 text-muted">{state.projects.find((p) => p.id === a.projectId)?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export function RightsPage() {
  return (
    <div>
      <PageHeader
        title="Rollen & rechten"
        intro="De standaardrechten per rol. Ze gelden per project en tot op het niveau van losse velden en bestanden. Uitzonderingen stel je in bij het product of bestand zelf."
      />
      <div className="space-y-6">
        {permissionMatrix.map((group) => (
          <section key={group.area}>
            <SectionTitle>{group.area}</SectionTitle>
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.12em] text-muted">
                    <th className="w-1/5 px-4 py-3 font-normal"></th>
                    {(["owner", "client", "contractor", "supplier"] as Role[]).map((r) => (
                      <th key={r} className="px-4 py-3 font-normal">{roleLabel[r]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.what} className="border-b border-border last:border-0 align-top">
                      <td className="px-4 py-3 font-medium">{row.what}</td>
                      {[row.owner, row.client, row.contractor, row.supplier].map((v, i) => (
                        <td key={i} className={`px-4 py-3 ${/^(Nee|Geen)/.test(v) ? "text-muted" : ""}`}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const { state, user } = useSession();
  const notices = noticesFor(state, user);
  const [off, setOff] = useState<string[]>([]);
  const projectName = (id: string) => state.projects.find((p) => p.id === id)?.name ?? "";
  const settings: Record<Role, string[]> = {
    owner: ["Klant heeft gereageerd", "Klant heeft akkoord gegeven", "Deadline gemist", "Uitvoerder meldt probleem", "Budget overschreden", "Bestand niet bekeken"],
    client: ["Nieuwe keuze nodig", "Ontwerp klaar", "Deadline nadert", "Budgetwijziging", "Akkoord gevraagd", "Planning gewijzigd"],
    contractor: ["Nieuwe taak", "Nieuwe tekening", "Planningwijziging", "Vraag van studio", "Akkoord op meerwerk"],
    supplier: ["Nieuwe aanvraag", "Vraag van studio"],
  };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <PageHeader title="Meldingen" intro="Alleen wat ertoe doet voor jouw rol." />
        {notices.length === 0 ? (
          <Empty>Geen meldingen.</Empty>
        ) : (
          <Card className="divide-y divide-border">
            {notices.map((n, i) => (
              <Link
                key={i}
                href={user.role === "supplier" ? "/" : `/projecten/${n.projectId}/${n.tab}`}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-background"
              >
                <span>{n.text}</span>
                {user.role !== "supplier" && <span className="shrink-0 text-xs text-muted">{projectName(n.projectId)}</span>}
              </Link>
            ))}
          </Card>
        )}
      </div>
      <Card className="h-fit p-5">
        <SectionTitle>Melding per e-mail of push bij</SectionTitle>
        <div className="space-y-2">
          {settings[user.role].map((s) => (
            <Toggle key={s} label={s} checked={!off.includes(s)} onChange={(v) => setOff(v ? off.filter((x) => x !== s) : [...off, s])} />
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">In de echte app stel je dit per kanaal in (e-mail of push). Hier onthoudt het prototype je keuze niet.</p>
      </Card>
    </div>
  );
}
