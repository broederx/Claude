"use client";

import { longDate, time } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { studio } from "@/lib/studio";
import { Card, Empty, PageHeader } from "@/components/ui";

// Besluitlogboek: elke keuze en elk akkoord wordt automatisch vastgelegd.
export default function BesluitenPage() {
  const { project, state, scoped } = useProject();
  if (!project) return null;

  const decisions = scoped(state.decisions).sort((a, b) => b.at.localeCompare(a.at));
  const who = (by: string) => (by === "client" ? project.clientName : studio.architect);

  return (
    <div>
      <PageHeader
        title="Besluitlogboek"
        intro="Elke keuze en elk akkoord wordt hier automatisch vastgelegd: wie, wanneer, wat en met welk gevolg. Zo is later nooit onduidelijk wat er is afgesproken."
      />
      {decisions.length === 0 ? (
        <Empty>Nog geen besluiten.</Empty>
      ) : (
        <>
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.12em] text-muted">
                  <th className="px-5 py-3 font-normal">Wanneer</th>
                  <th className="px-5 py-3 font-normal">Wie</th>
                  <th className="px-5 py-3 font-normal">Onderwerp</th>
                  <th className="px-5 py-3 font-normal">Besluit</th>
                  <th className="px-5 py-3 font-normal">Gevolg</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d) => (
                  <tr key={d.id} className="border-b border-border align-top last:border-0">
                    <td className="px-5 py-3 whitespace-nowrap tabular-nums">
                      {longDate(d.at)}
                      <span className="block text-xs text-muted">{time(d.at)}</span>
                    </td>
                    <td className="px-5 py-3">{who(d.by)}</td>
                    <td className="px-5 py-3 font-medium">{d.subject}</td>
                    <td className="px-5 py-3">{d.detail}</td>
                    <td className="px-5 py-3 text-muted">{d.consequence ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <ul className="space-y-3 md:hidden">
            {decisions.map((d) => (
              <li key={d.id}>
                <Card className="p-4 text-sm">
                  <p className="text-xs text-muted">
                    {longDate(d.at)} {time(d.at)} · {who(d.by)}
                  </p>
                  <p className="mt-1 font-medium">{d.subject}</p>
                  <p>{d.detail}</p>
                  {d.consequence && <p className="text-muted">{d.consequence}</p>}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
