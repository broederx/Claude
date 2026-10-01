import type { AppState, ProjectDoc } from "./types";

export const docCategories: Record<ProjectDoc["category"], string> = {
  tekening: "Tekening",
  "3d": "3D-impressie",
  contract: "Contract",
  advies: "Advies",
  overig: "Overig",
};

// Leveranciers zien alleen definitieve documentatie: goedgekeurd door de klant,
// geen contracten, en niet door de studio afgeschermd.
export function supplierCanSee(doc: ProjectDoc) {
  return doc.status === "goedgekeurd" && doc.category !== "contract" && !doc.hiddenFromSuppliers;
}

// Definitieve documenten van projecten waarvoor deze leverancier een order heeft.
export function supplierDocs(state: AppState, supplierId: string) {
  const orders = state.orders.filter((o) => o.supplierId === supplierId);
  return [...new Set(orders.map((o) => o.projectId))].map((projectId) => ({
    orderNumbers: orders.filter((o) => o.projectId === projectId).map((o) => o.number),
    docs: state.docs
      .filter((d) => d.projectId === projectId && supplierCanSee(d))
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
  }));
}
