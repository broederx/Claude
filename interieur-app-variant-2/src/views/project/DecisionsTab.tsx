"use client";

import { longDate, time } from "@/lib/format";
import { useProjectData } from "@/lib/session";
import { Card, Empty, PageHeader } from "@/components/ui";

// Besluitlogboek: wie keurde wat goed, wanneer, welke versie en met welke gevolgen.
export default function DecisionsTab({ projectId }: { projectId: string }) {
  const { state, scoped } = useProjectData(projectId);
  const decisions = scoped(state.decisions).sort((a, b) => b.at.localeCompare(a.at));
  const nameOf = (id: string) => state.users.find((u) => u.id === id)?.name ?? "";

  return (
    <div>
      <PageHeader
        title="Besluitlogboek"
        intro="Elke beslissing wordt automatisch vastgelegd: wie, wanneer, wat en welke gevolgen. Zo is later nooit onduidelijk wat er is afgesproken."
      />
      {decisions.length === 0 ? (
        <Empty>Nog geen besluiten.</Empty>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-[0.12em] text-muted">
                <th className="px-4 py-3 font-normal">Wanneer</th>
                <th className="px-4 py-3 font-normal">Wie</th>
                <th className="px-4 py-3 font-normal">Onderwerp</th>
                <th className="px-4 py-3 font-normal">Besluit</th>
                <th className="px-4 py-3 font-normal">Gevolg</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {longDate(d.at)}
                    <span className="block text-xs text-muted">{time(d.at)}</span>
                  </td>
                  <td className="px-4 py-3">{nameOf(d.byUserId)}</td>
                  <td className="px-4 py-3 font-medium">{d.subject}</td>
                  <td className="px-4 py-3">{d.detail}</td>
                  <td className="px-4 py-3 text-muted">{d.consequence ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
