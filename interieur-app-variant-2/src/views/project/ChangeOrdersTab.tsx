"use client";

import { useState, type FormEvent } from "react";
import { addItem, audit, setChangeOrderStatus } from "@/lib/actions";
import { euro, longDate, newId, nowIso } from "@/lib/format";
import { changeOrderStatus } from "@/lib/labels";
import { useProjectData } from "@/lib/session";
import { Badge, Button, Card, Empty, Field, PageHeader, inputClass } from "@/components/ui";
import Thread from "@/components/Thread";

const steps = ["Uitvoerder meldt", "Studio beoordeelt", "Klant beslist", "Budget aangepast en vastgelegd"];

// Workflow meerwerk: uitvoerder meldt, studio beoordeelt, klant beslist,
// budget en besluitlogboek worden bijgewerkt.
export default function ChangeOrdersTab({ projectId }: { projectId: string }) {
  const { state, user, scoped } = useProjectData(projectId);
  const [reporting, setReporting] = useState(false);
  const all = scoped(state.changeOrders).sort((a, b) => b.at.localeCompare(a.at));
  const items =
    user.role === "owner"
      ? all
      : user.role === "client"
        ? all.filter((c) => ["voorgesteld", "geaccepteerd", "geweigerd"].includes(c.status))
        : all.filter((c) => c.reportedBy === user.id);
  const stepOf = (status: string) => ({ gemeld: 1, voorgesteld: 2, geaccepteerd: 3, geweigerd: 3, afgewezen: 1 })[status] ?? 0;

  return (
    <div>
      <PageHeader
        title="Meerwerk"
        intro={
          user.role === "client"
            ? "Extra werk dat niet in de afspraak zat. Je beslist per voorstel; je budget wordt automatisch bijgewerkt."
            : user.role === "contractor"
              ? "Meld extra werk hier, niet via de app of de telefoon. De studio beoordeelt het en legt het aan de klant voor."
              : "Gemeld meerwerk beoordeel je eerst zelf; daarna leg je het voor aan de klant."
        }
        action={user.role === "contractor" && !reporting && <Button onClick={() => setReporting(true)}>+ Meerwerk melden</Button>}
      />
      <ol className="mb-8 grid gap-2 text-xs sm:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s} className="rounded-xl border border-border bg-surface px-3 py-2 text-muted">
            <span className="mr-1 tabular-nums text-foreground">{i + 1}.</span> {s}
          </li>
        ))}
      </ol>
      {reporting && <ReportForm projectId={projectId} onDone={() => setReporting(false)} />}
      {items.length === 0 ? (
        <Empty>Geen meerwerk.</Empty>
      ) : (
        <div className="space-y-4">
          {items.map((c) => {
            const reporter = state.users.find((u) => u.id === c.reportedBy);
            const s = changeOrderStatus[c.status];
            return (
              <Card key={c.id} className="p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-medium">{c.title}</p>
                    <p className="text-sm text-muted">
                      {user.role === "client" ? "Gemeld door de uitvoerder" : `Gemeld door ${reporter?.company}`} op {longDate(c.at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-2xl tabular-nums">{euro(c.amount)}</span>
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm text-foreground/80">{c.description}</p>
                <div className="mt-3 flex gap-1" aria-label={`Stap ${stepOf(c.status) + 1} van 4`}>
                  {steps.map((_, i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full ${i <= stepOf(c.status) ? (c.status === "geweigerd" || c.status === "afgewezen" ? "bg-warn" : "bg-sage") : "bg-border"}`} />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {user.role === "owner" && c.status === "gemeld" && (
                    <>
                      <Button onClick={() => setChangeOrderStatus(user, state, c.id, "voorgesteld")}>Voorleggen aan klant</Button>
                      <Button variant="secondary" onClick={() => setChangeOrderStatus(user, state, c.id, "afgewezen")}>Afwijzen</Button>
                    </>
                  )}
                  {user.role === "client" && c.status === "voorgesteld" && (
                    <>
                      <Button onClick={() => setChangeOrderStatus(user, state, c.id, "geaccepteerd")}>Accepteren ({euro(c.amount)})</Button>
                      <Button variant="secondary" onClick={() => setChangeOrderStatus(user, state, c.id, "geweigerd")}>Weigeren</Button>
                    </>
                  )}
                </div>
                <div className="mt-4 border-t border-border pt-3">
                  <Thread projectId={projectId} targetType="changeOrder" targetId={c.id} compact contractorIds={[c.reportedBy]} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReportForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const { user } = useProjectData(projectId);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    const title = String(d.get("title"));
    addItem("changeOrders", {
      id: newId(),
      projectId,
      reportedBy: user.id,
      title,
      description: String(d.get("description")),
      amount: Number(d.get("amount")) || 0,
      status: "gemeld",
      at: nowIso(),
    });
    audit(user, "gemeld", `Meerwerk: ${title}`, projectId);
    onDone();
  }
  return (
    <Card className="mb-6 p-5">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Wat is het extra werk?">
            <input name="title" required className={inputClass} />
          </Field>
        </div>
        <Field label="Bedrag excl. btw (€)">
          <input name="amount" type="number" min="0" required className={inputClass} />
        </Field>
        <div className="sm:col-span-3">
          <Field label="Toelichting en oorzaak">
            <textarea name="description" rows={3} required className={inputClass} />
          </Field>
        </div>
        <div className="flex gap-3">
          <Button type="submit">Melden aan studio</Button>
          <Button variant="ghost" onClick={onDone}>Annuleren</Button>
        </div>
      </form>
    </Card>
  );
}
