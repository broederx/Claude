import type { ChangeOrderStatus, FileFolder, Phase, ProductStatus, VersionStatus } from "./types";

export const phases: { id: Phase; label: string }[] = [
  { id: "intake", label: "Intake" },
  { id: "ontwerp", label: "Ontwerp" },
  { id: "offerte", label: "Offerte" },
  { id: "uitvoering", label: "Uitvoering" },
  { id: "oplevering", label: "Oplevering" },
];

export const phaseIndex = (phase: Phase) => phases.findIndex((p) => p.id === phase);

type Tone = "neutral" | "accent" | "sage" | "warn";

export const productStatus: Record<ProductStatus, { label: string; tone: Tone }> = {
  voorgesteld: { label: "Voorgesteld", tone: "accent" },
  goedgekeurd: { label: "Goedgekeurd", tone: "sage" },
  besteld: { label: "Besteld", tone: "neutral" },
  geleverd: { label: "Geleverd", tone: "sage" },
};

export const versionStatus: Record<VersionStatus, { label: string; tone: Tone }> = {
  concept: { label: "Concept", tone: "neutral" },
  "ter-akkoord": { label: "Akkoord gevraagd", tone: "accent" },
  goedgekeurd: { label: "Goedgekeurd", tone: "sage" },
  afgekeurd: { label: "Afgekeurd", tone: "warn" },
};

export const changeOrderStatus: Record<ChangeOrderStatus, { label: string; tone: Tone }> = {
  gemeld: { label: "Gemeld, studio beoordeelt", tone: "accent" },
  voorgesteld: { label: "Voorgelegd aan klant", tone: "accent" },
  geaccepteerd: { label: "Geaccepteerd", tone: "sage" },
  geweigerd: { label: "Geweigerd door klant", tone: "warn" },
  afgewezen: { label: "Afgewezen door studio", tone: "warn" },
};

export const folders: FileFolder[] = [
  "Intake",
  "Ontwerp",
  "Moodboards",
  "Plattegronden",
  "3D renders",
  "Werktekeningen",
  "Offertes",
  "Facturen",
  "Foto's",
  "Oplevering",
  "Intern",
];

export const partyLabel = { studio: "Studio", client: "Klant", contractor: "Uitvoerder", supplier: "Leverancier" } as const;

export const letter = (index: number) => String.fromCharCode(65 + index);
