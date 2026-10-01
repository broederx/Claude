import { today } from "@/lib/format";
import type { Invoice } from "@/lib/types";
import { Badge } from "@/components/ui";

export function InvoiceStatusBadge({ invoice }: { invoice: Invoice }) {
  const overdue = invoice.kind === "factuur" && invoice.status === "verzonden" && invoice.dueDate < today();
  if (overdue) return <Badge tone="warn">Vervallen</Badge>;
  switch (invoice.status) {
    case "concept":
      return <Badge>Concept</Badge>;
    case "verzonden":
      return <Badge tone="accent">{invoice.kind === "offerte" ? "Wacht op akkoord" : "Openstaand"}</Badge>;
    case "geaccepteerd":
      return <Badge tone="sage">Geaccepteerd</Badge>;
    case "betaald":
      return <Badge tone="sage">Betaald</Badge>;
    case "vervallen":
      return <Badge tone="warn">Vervallen</Badge>;
  }
}
