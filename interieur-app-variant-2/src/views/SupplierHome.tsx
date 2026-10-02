"use client";

import { useState } from "react";
import { audit, patchItem, setProductStatus } from "@/lib/actions";
import { euro, longDate } from "@/lib/format";
import { productStatus } from "@/lib/labels";
import { useSession } from "@/lib/session";
import { studio } from "@/lib/studio";
import type { Product } from "@/lib/types";
import { Badge, Button, Card, Empty } from "@/components/ui";
import Thread from "@/components/Thread";

// Leverancier: alleen de eigen productaanvragen, zonder klantnaam, verkoopprijs of projectdetails.
export default function SupplierHome() {
  const { state, user } = useSession();
  const requests = state.products.filter((p) => p.supplierUserId === user.id && p.status !== "voorgesteld");

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-muted">Leveranciers · {studio.name}</p>
        <h1 className="mt-2 font-serif text-4xl font-light">Productaanvragen</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Geef per aanvraag de leverdatum door, pas de status aan en voeg een specificatie toe. Je ziet alleen je eigen aanvragen.
        </p>
      </header>
      {requests.length === 0 ? <Empty>Geen aanvragen.</Empty> : requests.map((p) => <Request key={p.id} product={p} />)}
    </div>
  );
}

function Request({ product: p }: { product: Product }) {
  const { state, user } = useSession();
  const [date, setDate] = useState(p.expectedDelivery ?? "");
  const s = productStatus[p.status];

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-medium">{p.name}</p>
          <p className="text-sm text-muted">
            {p.sku} · inkoop {euro(p.purchasePrice)} · referentie MIM-{p.id.toUpperCase()}
          </p>
        </div>
        <Badge tone={s.tone}>{p.status === "goedgekeurd" ? "Nieuwe aanvraag" : s.label}</Badge>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Leverdatum
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1.5 text-foreground" />
        </label>
        <Button
          variant="secondary"
          disabled={!date || date === p.expectedDelivery}
          onClick={() => { patchItem("products", p.id, { expectedDelivery: date }); audit(user, "aangepast", `Leverdatum ${p.name}: ${date}`, p.projectId); }}
        >
          Leverdatum doorgeven
        </Button>
        {p.status === "goedgekeurd" && <Button onClick={() => setProductStatus(user, state, p.id, "besteld")}>Order bevestigen</Button>}
        {p.status === "besteld" && <Button onClick={() => setProductStatus(user, state, p.id, "geleverd")}>Geleverd</Button>}
        <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm">
          {p.specFile ? `Specificatie: ${p.specFile}` : "Specificatie uploaden"}
          <input
            type="file"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              patchItem("products", p.id, { specFile: f.name });
              audit(user, "geüpload", `Specificatie ${p.name}`, p.projectId);
            }}
          />
        </label>
      </div>
      {p.expectedDelivery && <p className="mt-2 text-sm text-muted">Doorgegeven levering: {longDate(p.expectedDelivery)}</p>}
      <div className="mt-4 border-t border-border pt-3">
        <Thread projectId={p.projectId} targetType="product" targetId={p.id} compact />
      </div>
    </Card>
  );
}
