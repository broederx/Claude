"use client";

import { audit, clientBudget, internalBudget, patchItem } from "@/lib/actions";
import { euro } from "@/lib/format";
import { useProjectData } from "@/lib/session";
import { changeOrderStatus } from "@/lib/labels";
import { Badge, Card, PageHeader, SectionTitle, Stat, Toggle } from "@/components/ui";
import Thread from "@/components/Thread";

function Line({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-2 text-sm ${strong ? "border-t border-border font-medium" : ""}`}>
      <span className={muted ? "text-muted" : ""}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

// Budget in lagen: intern (alleen studio), klant en uitvoerder.
export default function BudgetTab({ projectId }: { projectId: string }) {
  const { state, user, project, scoped } = useProjectData(projectId);
  const b = clientBudget(state, project);

  if (user.role === "contractor") {
    const agreement = scoped(state.agreements).find((a) => a.contractorId === user.id);
    const mine = scoped(state.changeOrders).filter((c) => c.reportedBy === user.id);
    const accepted = mine.filter((c) => c.status === "geaccepteerd").reduce((s, c) => s + c.amount, 0);
    return (
      <div className="max-w-2xl">
        <PageHeader title="Budget" intro="Alleen jouw werkposten. Het totale klantbudget is niet zichtbaar." />
        <Card className="p-5">
          <SectionTitle>Jouw opdracht</SectionTitle>
          <p className="mb-2 text-sm text-muted">{agreement?.scope}</p>
          <Line label="Aangenomen bedrag" value={euro(agreement?.amount ?? 0)} />
          {mine.map((c) => (
            <div key={c.id} className="flex justify-between gap-4 py-2 text-sm">
              <span>
                Meerwerk: {c.title} <Badge tone={changeOrderStatus[c.status].tone}>{changeOrderStatus[c.status].label}</Badge>
              </span>
              <span className="tabular-nums">{euro(c.amount)}</span>
            </div>
          ))}
          <Line label="Totaal inclusief geaccepteerd meerwerk" value={euro((agreement?.amount ?? 0) + accepted)} strong />
        </Card>
        <p className="mt-4 text-sm text-muted">Materialen die je verwerkt, staan onder Materialen.</p>
      </div>
    );
  }

  const clientLayer = (
    <Card className="p-5">
      <SectionTitle>{user.role === "owner" ? "Klantbudget (wat de klant ziet)" : "Je budget"}</SectionTitle>
      <Line label="Totaalbudget" value={euro(b.total)} />
      <Line label="Uitvoering (aannemers en vakmensen)" value={euro(b.contractors)} muted />
      <Line label="Goedgekeurde producten" value={euro(b.committedProducts)} muted />
      <Line label="Meerprijs gemaakte keuzes" value={euro(b.choiceDeltas)} muted />
      <Line label="Meerwerk" value={euro(b.meerwerk)} muted />
      <Line label="Reeds besteed" value={euro(b.spent)} strong />
      <Line label="Nog beschikbaar" value={euro(b.remaining)} strong />
      <div className="mt-3 space-y-1 rounded-xl bg-background p-3 text-sm text-muted">
        <p>Nog open: {euro(b.openProducts)} aan voorgestelde producten en {b.openChoices} keuze{b.openChoices === 1 ? "" : "s"}.</p>
        {b.pendingMeerwerk > 0 && <p>Meerwerk in afwachting van akkoord: {euro(b.pendingMeerwerk)}.</p>}
      </div>
    </Card>
  );

  if (user.role === "client") {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader title="Budget" intro="Wat er is afgesproken, wat al vastligt en wat er nog beschikbaar is." />
        {clientLayer}
        <Card className="p-5">
          <SectionTitle>Vragen over het budget</SectionTitle>
          <Thread projectId={projectId} targetType="budget" targetId={projectId} />
        </Card>
      </div>
    );
  }

  const i = internalBudget(state, project);
  const agreements = scoped(state.agreements);

  return (
    <div className="space-y-6">
      <PageHeader title="Budget" intro="Drie lagen. Het interne budget ziet alleen de studio; de klant ziet het klantbudget als je dat deelt; uitvoerders zien alleen hun eigen posten." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Productmarge" value={`${euro(i.productMargin)} (${i.marginPct}%)`} />
        <Stat label="Uren" value={`${i.hoursSpent} / ${i.hoursBudget}`} tone={i.hoursLeft < 20 ? "warn" : undefined} />
        <Stat label="Risicobuffer" value={euro(i.buffer)} />
        <Stat label="Klant nog beschikbaar" value={euro(b.remaining)} tone={b.remaining < 0 ? "warn" : undefined} />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>Intern budget · alleen studio</SectionTitle>
          <Line label="Verkoop producten" value={euro(i.sale)} />
          <Line label="Inkoop producten (na leverancierskorting)" value={euro(i.purchase)} muted />
          <Line label="Marge op producten" value={euro(i.productMargin)} strong />
          <Line label={`Honorarium (${i.hoursBudget} uur × ${euro(project.internal.hourlyRate)})`} value={euro(i.honorarium)} />
          <Line label={`Uren besteed (${i.hoursLeft} over)`} value={`${i.hoursSpent} uur`} muted />
          <Line label={`Risicobuffer (${project.internal.bufferPct}%)`} value={euro(i.buffer)} muted />
          <Line label="Verwachte winst tot nu toe" value={euro(i.expectedProfit)} strong />
        </Card>
        <div className="space-y-6">
          {clientLayer}
          <Toggle
            label="Klant mag het budget zien"
            checked={project.showBudgetToClient}
            onChange={(v) => {
              patchItem("projects", project.id, { showBudgetToClient: v });
              audit(user, "aangepast", `Budget ${v ? "gedeeld met" : "verborgen voor"} klant`, project.id);
            }}
          />
        </div>
        <Card className="p-5">
          <SectionTitle>Uitvoerderbudget · per uitvoerder alleen eigen posten</SectionTitle>
          {agreements.map((a) => {
            const u = state.users.find((x) => x.id === a.contractorId);
            const extra = scoped(state.changeOrders).filter((c) => c.reportedBy === a.contractorId && c.status === "geaccepteerd").reduce((s, c) => s + c.amount, 0);
            return <Line key={a.contractorId} label={`${u?.company} · ${a.scope}`} value={extra ? `${euro(a.amount)} + ${euro(extra)}` : euro(a.amount)} />;
          })}
        </Card>
        <Card className="p-5">
          <SectionTitle>Notities en vragen bij het budget</SectionTitle>
          <Thread projectId={projectId} targetType="budget" targetId={projectId} />
        </Card>
      </div>
    </div>
  );
}
