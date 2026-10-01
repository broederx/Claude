"use client";

import { setAppState } from "./store";
import { today } from "./format";
import type { AppState, Role } from "./types";

type Collection =
  | "projects"
  | "mood"
  | "docs"
  | "products"
  | "milestones"
  | "messages"
  | "invoices"
  | "suppliers"
  | "orders";
type Item<K extends Collection> = AppState[K][number];

export function setRole(role: Role) {
  setAppState((s) => ({ ...s, role }));
}

export function addItem<K extends Collection>(key: K, item: Item<K>) {
  setAppState((s) => ({ ...s, [key]: [...s[key], item] }));
}

export function patchItem<K extends Collection>(key: K, id: string, changes: Partial<Item<K>>) {
  setAppState((s) => ({
    ...s,
    [key]: (s[key] as Item<K>[]).map((item) => (item.id === id ? { ...item, ...changes } : item)),
  }));
}

export function removeItem<K extends Collection>(key: K, id: string) {
  setAppState((s) => ({ ...s, [key]: (s[key] as Item<K>[]).filter((item) => item.id !== id) }));
}

export function markRead(projectId: string, role: Role, at: string) {
  setAppState((s) => {
    const current = s.lastRead[projectId] ?? { architect: "", client: "" };
    if (current[role] >= at) return s;
    return { ...s, lastRead: { ...s.lastRead, [projectId]: { ...current, [role]: at } } };
  });
}

export interface OpenAction {
  projectId: string;
  label: string;
  href: string;
}

// Wat er per rol nog op een reactie wacht. Dit voedt de "Te doen"-lijsten.
export function openActions(state: AppState, role: Role, projectId?: string): OpenAction[] {
  const inScope = <T extends { projectId: string }>(items: T[]) =>
    items.filter((item) => !projectId || item.projectId === projectId);
  const base = (id: string) => `/projecten/${id}`;
  const actions: OpenAction[] = [];
  const now = today();

  for (const msgProject of new Set(inScope(state.messages).map((m) => m.projectId))) {
    const lastRead = state.lastRead[msgProject]?.[role] ?? "";
    const unread = state.messages.filter(
      (m) => m.projectId === msgProject && m.author !== role && m.at > lastRead,
    ).length;
    if (unread) {
      actions.push({
        projectId: msgProject,
        label: `${unread} ongelezen bericht${unread > 1 ? "en" : ""}`,
        href: `${base(msgProject)}/berichten`,
      });
    }
  }

  if (role === "client") {
    for (const doc of inScope(state.docs).filter((d) => d.status === "ter-goedkeuring")) {
      actions.push({ projectId: doc.projectId, label: `Bekijk en keur goed: ${doc.title}`, href: `${base(doc.projectId)}/documenten` });
    }
    const proposals = inScope(state.products).filter((p) => p.status === "voorstel");
    for (const id of new Set(proposals.map((p) => p.projectId))) {
      const count = proposals.filter((p) => p.projectId === id).length;
      actions.push({ projectId: id, label: `${count} productvoorstel${count > 1 ? "len" : ""} beoordelen`, href: `${base(id)}/producten` });
    }
    const unrated = inScope(state.mood).filter((m) => m.addedBy === "architect" && !m.reaction);
    for (const id of new Set(unrated.map((m) => m.projectId))) {
      actions.push({ projectId: id, label: "Geef je reactie op nieuwe moodboard-items", href: `${base(id)}/moodboard` });
    }
    for (const inv of inScope(state.invoices).filter((i) => i.status === "verzonden")) {
      actions.push({
        projectId: inv.projectId,
        label: inv.kind === "offerte" ? `Offerte ${inv.number} accepteren` : `Factuur ${inv.number} betalen`,
        href: `${base(inv.projectId)}/financien/${inv.id}`,
      });
    }
    for (const project of state.projects.filter((p) => !projectId || p.id === projectId)) {
      if (!state.briefings.some((b) => b.projectId === project.id)) {
        actions.push({ projectId: project.id, label: "Vul je woonwensen in", href: `${base(project.id)}/wensen` });
      }
    }
  } else {
    for (const doc of inScope(state.docs).filter((d) => d.status === "wijziging-gevraagd")) {
      actions.push({ projectId: doc.projectId, label: `Wijziging gevraagd: ${doc.title}`, href: `${base(doc.projectId)}/documenten` });
    }
    for (const item of inScope(state.mood)) {
      const last = item.comments.at(-1);
      if (last?.author === "client") {
        actions.push({ projectId: item.projectId, label: `Vraag op moodboard: ${item.title}`, href: `${base(item.projectId)}/moodboard` });
      }
    }
    for (const inv of inScope(state.invoices).filter((i) => i.status === "verzonden" && i.kind === "factuur" && i.dueDate < now)) {
      actions.push({ projectId: inv.projectId, label: `Factuur ${inv.number} is over de vervaldatum`, href: `${base(inv.projectId)}/financien/${inv.id}` });
    }
    for (const p of inScope(state.products).filter((p) => p.status === "goedgekeurd")) {
      const supplier = state.suppliers.find((s) => s.id === p.supplierId);
      actions.push({
        projectId: p.projectId,
        label: `Bestellen bij ${supplier?.name ?? "leverancier"}: ${p.name}`,
        href: `/leveranciers/${p.supplierId}`,
      });
    }
  }

  return actions;
}
