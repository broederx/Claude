"use client";

import { channelsFor, fileVisible, latestApproved, milestonesFor, productVisible, projectsFor } from "./access";
import { daysBetween, euro, newId, nowIso, signedEuro, today } from "./format";
import { setAppState } from "./store";
import type {
  AppState,
  AuditEntry,
  ChangeOrderStatus,
  Channel,
  Comment,
  Decision,
  Project,
  ProductStatus,
  TargetType,
  Task,
  TaskStatus,
  User,
} from "./types";

type Collection =
  | "users"
  | "projects"
  | "mood"
  | "choices"
  | "products"
  | "tasks"
  | "milestones"
  | "files"
  | "comments"
  | "changeOrders"
  | "issues";
type Item<K extends Collection> = AppState[K][number];

export function addItem<K extends Collection>(key: K, item: Item<K>) {
  setAppState((s) => ({ ...s, [key]: [...s[key], item] }));
}

export function patchItem<K extends Collection>(key: K, id: string, changes: Partial<Item<K>>) {
  setAppState((s) => ({
    ...s,
    [key]: (s[key] as Item<K>[]).map((item) => (item.id === id ? { ...item, ...changes } : item)),
  }));
}

export function setCurrentUser(id: string) {
  setAppState((s) => ({ ...s, currentUserId: id }));
}

// ---- Auditlog en besluitlogboek ----

export function audit(user: User, action: AuditEntry["action"], target: string, projectId?: string) {
  setAppState((s) => ({ ...s, audit: [...s.audit, { id: newId(), at: nowIso(), userId: user.id, projectId, action, target }] }));
}

function decide(user: User, projectId: string, subject: string, detail: string, consequence?: string) {
  const entry: Decision = { id: newId(), projectId, at: nowIso(), byUserId: user.id, subject, detail, consequence };
  setAppState((s) => ({ ...s, decisions: [...s.decisions, entry] }));
}

// ---- Workflow: ontwerp goedkeuren ----

export function uploadVersion(user: User, fileId: string, askApproval: boolean) {
  setAppState((s) => ({
    ...s,
    files: s.files.map((f) =>
      f.id === fileId
        ? {
            ...f,
            versions: [
              ...f.versions,
              { version: (f.versions.at(-1)?.version ?? 0) + 1, uploadedAt: nowIso(), status: askApproval ? "ter-akkoord" : "concept" },
            ],
          }
        : f,
    ),
  }));
}

export function requestApproval(fileId: string, version: number) {
  setAppState((s) => ({
    ...s,
    files: s.files.map((f) =>
      f.id === fileId
        ? { ...f, visibleToClient: true, versions: f.versions.map((v) => (v.version === version ? { ...v, status: "ter-akkoord" } : v)) }
        : f,
    ),
  }));
}

// Bij akkoord wordt de versie gelockt, en krijgen uitvoerders automatisch
// toegang als het bestand bij de werkset hoort.
export function decideVersion(user: User, fileId: string, version: number, approve: boolean, note?: string) {
  let title = "";
  let projectId = "";
  let released = false;
  setAppState((s) => ({
    ...s,
    files: s.files.map((f) => {
      if (f.id !== fileId) return f;
      title = f.title;
      projectId = f.projectId;
      released = approve && f.releaseOnApproval && !f.visibleToContractor;
      return {
        ...f,
        visibleToContractor: f.visibleToContractor || (approve && f.releaseOnApproval),
        versions: f.versions.map((v) =>
          v.version === version
            ? { ...v, status: approve ? "goedgekeurd" : "afgekeurd", decidedBy: user.id, decidedAt: nowIso(), note: note || v.note }
            : v,
        ),
      };
    }),
  }));
  audit(user, approve ? "goedgekeurd" : "afgekeurd", `${title} v${version}`, projectId);
  if (approve) {
    decide(user, projectId, title, `Akkoord op versie ${version}.`, released ? "Vrijgegeven aan de uitvoerders van dit project" : undefined);
  }
}

// ---- Keuzes en producten ----

export function makeChoice(user: User, state: AppState, choiceId: string, optionId: string) {
  const choice = state.choices.find((c) => c.id === choiceId);
  const option = choice?.options.find((o) => o.id === optionId);
  if (!choice || !option) return;
  patchItem("choices", choiceId, { chosenOptionId: optionId, decidedAt: nowIso() });
  const letter = String.fromCharCode(65 + choice.options.indexOf(option));
  decide(user, choice.projectId, choice.question, `Optie ${letter} gekozen: ${option.label}.`, option.priceDelta ? `Meerprijs ${signedEuro(option.priceDelta)}` : undefined);
  audit(user, "goedgekeurd", `Keuze: ${choice.question} → ${option.label}`, choice.projectId);
}

export function setProductStatus(user: User, state: AppState, productId: string, status: ProductStatus) {
  const p = state.products.find((x) => x.id === productId);
  if (!p) return;
  const actionBy = status === "goedgekeurd" ? "studio" : status === "besteld" ? "supplier" : status === "geleverd" ? "contractor" : "client";
  patchItem("products", productId, { status, actionBy });
  audit(user, status === "goedgekeurd" ? "goedgekeurd" : "aangepast", `${p.name}: ${status}`, p.projectId);
  if (status === "goedgekeurd" && user.role === "client") {
    decide(user, p.projectId, p.name, "Product goedgekeurd.", `${euro(p.price)} uit budget inrichting`);
  }
}

// ---- Workflow: meerwerk ----

export function setChangeOrderStatus(user: User, state: AppState, id: string, status: ChangeOrderStatus) {
  const co = state.changeOrders.find((c) => c.id === id);
  if (!co) return;
  patchItem("changeOrders", id, { status });
  audit(user, status === "geaccepteerd" ? "goedgekeurd" : "aangepast", `Meerwerk: ${co.title} → ${status}`, co.projectId);
  if (status === "geaccepteerd") decide(user, co.projectId, `Meerwerk: ${co.title}`, "Meerwerkvoorstel geaccepteerd.", `Meerwerk ${euro(co.amount)}, budget aangepast`);
  if (status === "geweigerd") decide(user, co.projectId, `Meerwerk: ${co.title}`, "Meerwerkvoorstel geweigerd.");
}

// ---- Taken ----

export function isBlocked(task: Task, tasks: Task[]) {
  return task.dependsOn.some((id) => tasks.find((t) => t.id === id)?.status !== "klaar");
}

export function setTaskStatus(user: User, task: Task, status: TaskStatus) {
  patchItem("tasks", task.id, { status });
  audit(user, "aangepast", `Taak ${task.title}: ${status}`, task.projectId);
}

// ---- Communicatie ----

export function postComment(
  user: User,
  projectId: string,
  targetType: TargetType,
  targetId: string,
  channel: Channel,
  text: string,
  toUserId?: string,
) {
  const c: Comment = { id: newId(), projectId, targetType, targetId, channel, authorId: user.id, text, at: nowIso(), toUserId };
  addItem("comments", c);
}

// ---- Budget in lagen ----

export function clientBudget(state: AppState, project: Project) {
  const products = state.products.filter((p) => p.projectId === project.id);
  const committedProducts = products.filter((p) => p.status !== "voorgesteld").reduce((s, p) => s + p.price, 0);
  const openProducts = products.filter((p) => p.status === "voorgesteld").reduce((s, p) => s + p.price, 0);
  const contractors = state.agreements.filter((a) => a.projectId === project.id).reduce((s, a) => s + a.amount, 0);
  const choices = state.choices.filter((c) => c.projectId === project.id);
  const choiceDeltas = choices.reduce((s, c) => s + (c.options.find((o) => o.id === c.chosenOptionId)?.priceDelta ?? 0), 0);
  const meerwerk = state.changeOrders
    .filter((c) => c.projectId === project.id && c.status === "geaccepteerd")
    .reduce((s, c) => s + c.amount, 0);
  const pendingMeerwerk = state.changeOrders
    .filter((c) => c.projectId === project.id && c.status === "voorgesteld")
    .reduce((s, c) => s + c.amount, 0);
  const spent = committedProducts + contractors + choiceDeltas + meerwerk;
  return {
    total: project.budget,
    spent,
    committedProducts,
    contractors,
    choiceDeltas,
    meerwerk,
    pendingMeerwerk,
    openProducts,
    openChoices: choices.filter((c) => !c.chosenOptionId).length,
    remaining: project.budget - spent,
  };
}

export function internalBudget(state: AppState, project: Project) {
  const products = state.products.filter((p) => p.projectId === project.id && p.status !== "voorgesteld");
  const sale = products.reduce((s, p) => s + p.price, 0);
  const purchase = products.reduce((s, p) => s + p.purchasePrice, 0);
  const { hourlyRate, hoursBudget, hoursSpent, bufferPct } = project.internal;
  const honorarium = hoursBudget * hourlyRate;
  const buffer = Math.round((project.budget * bufferPct) / 100);
  return {
    sale,
    purchase,
    productMargin: sale - purchase,
    marginPct: sale ? Math.round(((sale - purchase) / sale) * 100) : 0,
    honorarium,
    hoursBudget,
    hoursSpent,
    hoursLeft: hoursBudget - hoursSpent,
    buffer,
    expectedProfit: sale - purchase + hoursSpent * hourlyRate,
  };
}

// ---- Risico's en blokkades ----

export interface Risk {
  level: "hoog" | "middel";
  text: string;
  tab: string;
}

export function risksFor(state: AppState, project: Project): Risk[] {
  const risks: Risk[] = [];
  const now = today();
  const tasks = state.tasks.filter((t) => t.projectId === project.id);
  for (const c of state.choices.filter((c) => c.projectId === project.id && !c.chosenOptionId)) {
    if (c.deadline < now) risks.push({ level: "hoog", text: `Keuze te laat: ${c.question}`, tab: "ontwerp" });
    else if (daysBetween(now, c.deadline) <= 2) risks.push({ level: "middel", text: `Keuze-deadline nadert: ${c.question}`, tab: "ontwerp" });
  }
  for (const t of tasks.filter((t) => t.status !== "klaar")) {
    if (isBlocked(t, tasks) && daysBetween(now, t.start) <= 3) {
      const blockers = t.dependsOn.map((id) => tasks.find((x) => x.id === id)?.title).filter(Boolean).join(", ");
      risks.push({ level: daysBetween(now, t.start) < 0 ? "hoog" : "middel", text: `${t.title} wacht op: ${blockers}`, tab: "taken" });
    }
    if (t.due < now) risks.push({ level: "hoog", text: `Taak over de deadline: ${t.title}`, tab: "taken" });
  }
  for (const i of state.issues.filter((i) => i.projectId === project.id && i.status === "open")) {
    risks.push({ level: "hoog", text: `Probleem gemeld: ${i.title}`, tab: "taken" });
  }
  const budget = clientBudget(state, project);
  if (budget.spent + budget.pendingMeerwerk > project.budget) {
    risks.push({ level: "hoog", text: `Budget overschreden met ${euro(budget.spent + budget.pendingMeerwerk - project.budget)}`, tab: "budget" });
  }
  for (const p of state.products.filter((p) => p.projectId === project.id && p.expectedDelivery)) {
    const dependent = tasks.find((t) => t.title.toLowerCase().includes("vloer") && p.name.toLowerCase().includes("vloer"));
    if (dependent && p.expectedDelivery! > dependent.start) {
      risks.push({ level: "hoog", text: `${p.name} wordt na de start van "${dependent.title}" geleverd`, tab: "producten" });
    }
  }
  for (const f of state.files.filter((f) => f.projectId === project.id)) {
    const pending = f.versions.find((v) => v.status === "ter-akkoord");
    if (pending && daysBetween(pending.uploadedAt, now) >= 5) {
      risks.push({ level: "middel", text: `${f.title} wacht al ${daysBetween(pending.uploadedAt, now)} dagen op akkoord`, tab: "bestanden" });
    }
  }
  return risks;
}

// ---- Openstaande acties per rol (dashboard en meldingen) ----

export interface Notice {
  projectId: string;
  text: string;
  tab: string;
}

export function noticesFor(state: AppState, user: User): Notice[] {
  const notices: Notice[] = [];
  const projects = projectsFor(state, user);
  for (const project of projects) {
    const pid = project.id;
    const inProject = <T extends { projectId: string }>(items: T[]) => items.filter((i) => i.projectId === pid);
    if (user.role === "client") {
      for (const c of inProject(state.choices).filter((c) => !c.chosenOptionId)) {
        notices.push({ projectId: pid, text: `Kies optie ${c.options.map((_, i) => String.fromCharCode(65 + i)).join(", ")} vóór ${c.deadline.split("-").reverse().join("-")}: ${c.question}`, tab: "ontwerp" });
      }
      for (const f of inProject(state.files).filter((f) => fileVisible(user, f) && f.versions.some((v) => v.status === "ter-akkoord"))) {
        notices.push({ projectId: pid, text: `Akkoord gevraagd: ${f.title}`, tab: "bestanden" });
      }
      for (const p of inProject(state.products).filter((p) => productVisible(user, p) && p.status === "voorgesteld")) {
        notices.push({ projectId: pid, text: `Product beoordelen: ${p.name}`, tab: "producten" });
      }
      for (const co of inProject(state.changeOrders).filter((c) => c.status === "voorgesteld")) {
        notices.push({ projectId: pid, text: `Meerwerkvoorstel: ${co.title} (${euro(co.amount)})`, tab: "meerwerk" });
      }
    }
    if (user.role === "owner") {
      for (const co of inProject(state.changeOrders).filter((c) => c.status === "gemeld")) {
        notices.push({ projectId: pid, text: `Meerwerk beoordelen: ${co.title}`, tab: "meerwerk" });
      }
      for (const i of inProject(state.issues).filter((i) => i.status === "open")) {
        notices.push({ projectId: pid, text: `Probleem gemeld: ${i.title}`, tab: "taken" });
      }
      const threads = new Map<string, Comment>();
      for (const c of inProject(state.comments)) threads.set(`${c.targetType}:${c.targetId}:${c.channel}`, c);
      for (const c of threads.values()) {
        const author = state.users.find((u) => u.id === c.authorId);
        if (author && author.role !== "owner") notices.push({ projectId: pid, text: `${author.name} wacht op antwoord: "${c.text.slice(0, 60)}${c.text.length > 60 ? "…" : ""}"`, tab: "communicatie" });
      }
      for (const p of inProject(state.products).filter((p) => p.status === "goedgekeurd" && p.actionBy === "studio")) {
        notices.push({ projectId: pid, text: `Bestellen: ${p.name}`, tab: "producten" });
      }
    }
    if (user.role === "contractor") {
      const mine = inProject(state.tasks).filter((t) => t.assigneeId === user.id && t.status !== "klaar");
      for (const t of mine.filter((t) => !isBlocked(t, state.tasks) && t.start <= today())) {
        notices.push({ projectId: pid, text: `Aan de slag: ${t.title}`, tab: "taken" });
      }
      for (const c of inProject(state.comments).filter((c) => c.channel === "uitvoerder" && c.toUserId === user.id)) {
        notices.push({ projectId: pid, text: `Vraag van de studio: "${c.text.slice(0, 60)}"`, tab: "communicatie" });
      }
      for (const f of inProject(state.files).filter((f) => fileVisible(user, f))) {
        const v = latestApproved(f);
        if (v && daysBetween(v.decidedAt ?? v.uploadedAt, today()) <= 7) notices.push({ projectId: pid, text: `Nieuwe tekening: ${f.title} v${v.version}`, tab: "bestanden" });
      }
      for (const co of inProject(state.changeOrders).filter((c) => c.reportedBy === user.id && c.status === "geaccepteerd")) {
        notices.push({ projectId: pid, text: `Akkoord op meerwerk: ${co.title}`, tab: "meerwerk" });
      }
    }
  }
  if (user.role === "supplier") {
    for (const p of state.products.filter((p) => p.supplierUserId === user.id)) {
      if (p.status === "goedgekeurd") notices.push({ projectId: p.projectId, text: `Nieuwe aanvraag: ${p.name}`, tab: "" });
      if (p.status === "besteld" && !p.expectedDelivery) notices.push({ projectId: p.projectId, text: `Leverdatum doorgeven: ${p.name}`, tab: "" });
    }
  }
  return notices;
}

// Wie welke kanalen ziet, gebruikt door de communicatieweergave.
export function canPostIn(user: User, channel: Channel) {
  return channelsFor(user.role).includes(channel);
}

export function visibleMilestones(user: User, state: AppState, projectId: string) {
  return milestonesFor(user, state.milestones.filter((m) => m.projectId === projectId)).sort((a, b) => a.date.localeCompare(b.date));
}

// Automatische projectbriefing uit de intake.
export function briefing(project: Project) {
  const i = project.intake;
  if (!i.stijl?.length && !i.budgetIndicatie) return "";
  const style = i.stijl?.length ? `een ${i.stijl.join("/").toLowerCase()}-stijl` : "een nog te bepalen stijl";
  const parts = [
    `Klant wil ${style}`,
    i.budgetIndicatie ? `budget ${euro(i.budgetIndicatie)}` : null,
    i.focus?.length ? `focus op ${i.focus.join("/").toLowerCase()}` : null,
    i.opleveringGewenst ? `oplevering gewenst vóór ${new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(new Date(i.opleveringGewenst))}` : null,
  ].filter(Boolean);
  const extras = [
    i.kinderen ? "kinderen in huis" : null,
    i.huisdieren ? "huisdieren" : null,
    i.thuiswerken ? "thuiswerkplek nodig" : null,
  ].filter(Boolean);
  return `${parts.join(", ")}.${extras.length ? ` Let op: ${extras.join(", ")}.` : ""}${i.donts ? ` Niet: ${i.donts.toLowerCase()}.` : ""}`;
}
