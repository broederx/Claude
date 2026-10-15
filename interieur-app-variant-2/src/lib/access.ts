// Alle rechtenregels op één plek. Schermen vragen hier wat een gebruiker mag
// zien of doen; nergens anders wordt over rechten beslist.
import { today } from "./format";
import type { AppState, Channel, Comment, Milestone, Product, Project, ProjectFile, Role, Task, User } from "./types";

export const roleLabel: Record<Role, string> = {
  owner: "Studio",
  client: "Klant",
  contractor: "Uitvoerder",
  supplier: "Leverancier",
};

export function accessExpired(user: User) {
  return !!user.accessUntil && user.accessUntil < today();
}

// Project-based access: een schilder voor project A mag project B niet eens zien bestaan.
export function canSeeProject(user: User, project: Project) {
  if (user.role === "owner") return true;
  return user.projectIds.includes(project.id) && !accessExpired(user);
}

export function projectsFor(state: AppState, user: User) {
  return state.projects.filter((p) => canSeeProject(user, p));
}

// Uitvoerders zien andere uitvoerders alleen als ze aan hetzelfde project werken.
export function peopleOnProject(state: AppState, user: User, projectId: string) {
  const people = state.users.filter((u) => u.projectIds.includes(projectId) || u.role === "owner");
  if (user.role === "owner") return people;
  if (user.role === "client") return people.filter((u) => u.role !== "supplier");
  return people.filter((u) => u.role === "owner" || u.id === user.id);
}

// ---- Bestanden ----

export function fileVisible(user: User, file: ProjectFile) {
  if (user.role === "owner") return true;
  if (file.onlyUserIds?.length && !file.onlyUserIds.includes(user.id)) return false;
  if (user.role === "client") return file.visibleToClient;
  if (user.role === "contractor") return file.visibleToContractor && !!latestApproved(file);
  return false;
}

export function latestApproved(file: ProjectFile) {
  return [...file.versions].reverse().find((v) => v.status === "goedgekeurd");
}

// Uitvoerders zien standaard alleen de laatste goedgekeurde versie; klanten
// zien geen concepten.
export function versionsFor(user: User, file: ProjectFile) {
  if (user.role === "owner") return file.versions;
  if (user.role === "contractor") {
    const v = latestApproved(file);
    return v ? [v] : [];
  }
  return file.versions.filter((v) => v.status !== "concept");
}

// ---- Producten (field-level permissions) ----

export function productVisible(user: User, p: Product) {
  if (user.role === "owner") return true;
  if (user.role === "client") return p.visibleToClient;
  if (user.role === "contractor") return p.visibleToContractor && p.status !== "voorgesteld";
  return p.supplierUserId === user.id;
}

export interface ProductFields {
  price: boolean;
  purchase: boolean;
  margin: boolean;
  supplier: boolean;
  internalNote: boolean;
  sku: boolean;
}

export function productFields(user: User, p: Product): ProductFields {
  const owner = user.role === "owner";
  return {
    price: owner || user.role === "client",
    purchase: owner || user.role === "supplier",
    margin: owner,
    supplier: owner || (user.role === "client" && p.supplierVisibleToClient),
    internalNote: owner,
    sku: owner || user.role === "contractor" || user.role === "supplier",
  };
}

// ---- Planning: één planning, drie weergaven ----

export function milestonesFor(user: User, items: Milestone[]) {
  if (user.role === "owner") return items;
  if (user.role === "client") return items.filter((m) => m.forClient);
  if (user.role === "contractor") return items.filter((m) => m.forContractor);
  return [];
}

export function tasksFor(user: User, tasks: Task[]) {
  if (user.role === "owner") return tasks;
  if (user.role === "contractor") return tasks.filter((t) => t.assigneeId === user.id);
  return [];
}

// ---- Communicatie ----

export function channelsFor(role: Role): Channel[] {
  if (role === "owner") return ["intern", "klant", "uitvoerder", "leverancier"];
  if (role === "client") return ["klant"];
  if (role === "contractor") return ["uitvoerder"];
  return ["leverancier"];
}

export function defaultChannel(role: Role): Channel {
  return role === "owner" ? "klant" : channelsFor(role)[0];
}

// Een uitvoerder ziet alleen eigen berichten en antwoorden van de studio
// daarop, geen privéklantcommunicatie of andere uitvoerders.
export function commentVisible(state: AppState, user: User, c: Comment) {
  if (!channelsFor(user.role).includes(c.channel)) return false;
  if (user.role === "contractor") {
    if (c.authorId === user.id || c.toUserId === user.id) return true;
    if (c.targetType === "task") return state.tasks.find((t) => t.id === c.targetId)?.assigneeId === user.id;
    return false;
  }
  if (user.role === "supplier") {
    return state.products.find((x) => x.id === c.targetId)?.supplierUserId === user.id;
  }
  return true;
}

export const channelLabel: Record<Channel, string> = {
  intern: "Interne notitie",
  klant: "Met klant",
  uitvoerder: "Met uitvoerder",
  leverancier: "Met leverancier",
};

// ---- Tabs per rol binnen een project ----

export type TabId =
  | "overzicht"
  | "intake"
  | "ontwerp"
  | "producten"
  | "planning"
  | "taken"
  | "bestanden"
  | "budget"
  | "meerwerk"
  | "communicatie"
  | "besluiten"
  | "toegang";

export function tabsFor(user: User, project: Project): { id: TabId; label: string }[] {
  const all: Record<TabId, string> = {
    overzicht: "Overzicht",
    intake: "Intake",
    ontwerp: "Moodboard & keuzes",
    producten: user.role === "contractor" ? "Materialen" : "Producten",
    planning: "Planning",
    taken: user.role === "contractor" ? "Mijn taken" : "Taken",
    bestanden: user.role === "contractor" ? "Werktekeningen" : "Bestanden",
    budget: "Budget",
    meerwerk: "Meerwerk",
    communicatie: user.role === "contractor" ? "Vragen" : "Communicatie",
    besluiten: "Besluitlogboek",
    toegang: "Toegang",
  };
  const ids: TabId[] =
    user.role === "owner"
      ? ["overzicht", "intake", "ontwerp", "producten", "planning", "taken", "bestanden", "budget", "meerwerk", "communicatie", "besluiten", "toegang"]
      : user.role === "client"
        ? ["overzicht", "intake", "ontwerp", "producten", "planning", "bestanden", ...(project.showBudgetToClient ? (["budget"] as TabId[]) : []), "meerwerk", "communicatie", "besluiten"]
        : user.role === "contractor"
          ? ["overzicht", "taken", "planning", "bestanden", "producten", "budget", "meerwerk", "communicatie"]
          : [];
  return ids.map((id) => ({ id, label: all[id] }));
}

// ---- Overzicht voor de pagina Rollen & rechten ----

export const permissionMatrix: { area: string; rows: { what: string; owner: string; client: string; contractor: string; supplier: string }[] }[] = [
  {
    area: "Projecten",
    rows: [
      { what: "Projecten zien", owner: "Alle", client: "Alleen eigen project", contractor: "Alleen gekoppelde projecten, tot einddatum toegang", supplier: "Geen; alleen eigen productaanvragen" },
      { what: "Andere deelnemers zien", owner: "Alle", client: "Studio en uitvoerders van eigen project", contractor: "Alleen de studio", supplier: "Alleen de studio" },
    ],
  },
  {
    area: "Ontwerp",
    rows: [
      { what: "Moodboards", owner: "Beheren", client: "Bekijken", contractor: "Nee", supplier: "Nee" },
      { what: "Ontwerpkeuzes A/B/C", owner: "Opstellen", client: "Kiezen voor deadline", contractor: "Nee", supplier: "Nee" },
    ],
  },
  {
    area: "Producten (per veld)",
    rows: [
      { what: "Productnaam, ruimte, status", owner: "Ja", client: "Als zichtbaar voor klant", contractor: "Als zichtbaar voor uitvoerder en niet meer voorgesteld", supplier: "Alleen eigen aanvragen" },
      { what: "Verkoopprijs", owner: "Ja", client: "Ja", contractor: "Nee", supplier: "Nee" },
      { what: "Inkoopprijs", owner: "Ja", client: "Nee", contractor: "Nee", supplier: "Ja, eigen offerte" },
      { what: "Marge", owner: "Ja", client: "Nee", contractor: "Nee", supplier: "Nee" },
      { what: "Leverancier", owner: "Ja", client: "Per product instelbaar", contractor: "Nee", supplier: "n.v.t." },
      { what: "Interne notitie", owner: "Ja", client: "Nee", contractor: "Nee", supplier: "Nee" },
    ],
  },
  {
    area: "Budget",
    rows: [
      { what: "Intern budget (inkoop, marges, uren, buffer)", owner: "Ja", client: "Nee", contractor: "Nee", supplier: "Nee" },
      { what: "Klantbudget (totaal, besteed, meerwerk)", owner: "Ja", client: "Als de studio het deelt", contractor: "Nee", supplier: "Nee" },
      { what: "Uitvoerderbudget (aangenomen bedrag, eigen meerwerk)", owner: "Ja", client: "Nee", contractor: "Alleen eigen posten", supplier: "Nee" },
    ],
  },
  {
    area: "Bestanden",
    rows: [
      { what: "Bestanden zien", owner: "Alle versies", client: "Als klant zichtbaar, geen concepten", contractor: "Als uitvoerder zichtbaar, alleen laatste goedgekeurde versie", supplier: "Nee" },
      { what: "Uploaden en verwijderen", owner: "Ja", client: "Nee", contractor: "Alleen voortgangsfoto's", supplier: "Specificatie bij eigen product" },
      { what: "Akkoord geven", owner: "Nee, vraagt akkoord", client: "Ja", contractor: "Nee", supplier: "Nee" },
    ],
  },
  {
    area: "Planning en taken",
    rows: [
      { what: "Planning", owner: "Alles, incl. bestelmomenten en facturatie", client: "Hoofdlijnen", contractor: "Uitvoering en eigen taken", supplier: "Nee" },
      { what: "Taken afvinken, foto's, issues", owner: "Ja", client: "Nee", contractor: "Eigen taken", supplier: "Nee" },
    ],
  },
  {
    area: "Communicatie",
    rows: [
      { what: "Interne notities", owner: "Ja", client: "Nee", contractor: "Nee", supplier: "Nee" },
      { what: "Berichten", owner: "Alle kanalen", client: "Kanaal met studio", contractor: "Eigen vragen aan studio", supplier: "Per eigen product" },
      { what: "Besluitlogboek", owner: "Ja", client: "Ja", contractor: "Nee", supplier: "Nee" },
      { what: "Auditlog", owner: "Ja", client: "Nee", contractor: "Nee", supplier: "Nee" },
    ],
  },
  {
    area: "Beveiliging",
    rows: [
      { what: "Tweestapsverificatie", owner: "Verplicht", client: "Optioneel", contractor: "Verplicht bij gevoelige projecten", supplier: "Optioneel" },
      { what: "Toegang", owner: "Permanent", client: "Persoonlijke uitnodiging", contractor: "Uitnodiging met einddatum", supplier: "Uitnodiging per aanvraag" },
    ],
  },
];
