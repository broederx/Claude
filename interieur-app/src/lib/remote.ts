"use client";

// Koppeling tussen de app en de Supabase-database. De schermen werken met
// dezelfde AppState als in de demo; deze module laadt die state uit de
// database en stuurt elke wijziging terug (toevoegen, aanpassen, verwijderen).
// Welke rijen iemand ziet en mag wijzigen, bepaalt de database zelf (RLS).
import { supabase } from "./supabase";
import type { AppState, Project, Role } from "./types";

type Synced = "projects" | "mood" | "briefings" | "docs" | "products" | "milestones" | "messages" | "invoices" | "contractors" | "choices" | "decisions";

const tables: Record<Synced, string> = {
  projects: "projects",
  mood: "mood_items",
  briefings: "briefings",
  docs: "documents",
  products: "products",
  milestones: "milestones",
  messages: "messages",
  invoices: "invoices",
  contractors: "contractors",
  choices: "choices",
  decisions: "decisions",
};

const keyOf = (collection: Synced) => (collection === "briefings" ? "projectId" : "id");

const snake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

// Database-kolommen voor e-mailadressen zijn altijd in kleine letters.
const lowercase = new Set(["email", "client_email"]);

type Row = Record<string, unknown>;

function toRow(item: object, keys?: string[]): Row {
  const row: Row = {};
  for (const [k, v] of Object.entries(item)) {
    if (keys && !keys.includes(k)) continue;
    const column = snake(k);
    row[column] = v === undefined ? null : lowercase.has(column) && typeof v === "string" ? v.trim().toLowerCase() : v;
  }
  return row;
}

function fromRow<T>(row: Row): T {
  const item: Row = {};
  for (const [k, v] of Object.entries(row)) {
    // Lege velden heten in de app "undefined", niet null.
    if (v !== null) item[camel(k)] = typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) ? v.slice(0, 19) : v;
  }
  return item as T;
}

export interface Identity {
  role: Role;
  contractorId?: string;
}

export async function fetchIdentity(): Promise<Identity | null> {
  const { data, error } = await supabase!.rpc("my_role");
  if (error) throw error;
  return (data as Identity | null) ?? null;
}

export async function loadState(base: AppState, identity: Identity): Promise<AppState> {
  const db = supabase!;
  const next: AppState = { ...base, role: identity.role, contractorView: identity.contractorId ?? "" };

  const collections = Object.keys(tables) as Synced[];
  const results = await Promise.all(
    collections.map((c) =>
      // Uitvoerders lezen de projectentabel niet; zij krijgen alleen naam en adres via een aparte functie.
      identity.role === "contractor" && c === "projects" ? Promise.resolve({ data: [], error: null }) : db.from(tables[c]).select("*"),
    ),
  );
  results.forEach((res, i) => {
    if (res.error) throw res.error;
    (next as unknown as Record<string, unknown>)[collections[i]] = (res.data ?? []).map((r) => fromRow(r as Row));
  });

  if (identity.role === "contractor") {
    const { data, error } = await db.rpc("contractor_projects");
    if (error) throw error;
    next.projects = ((data ?? []) as { id: string; name: string; address: string }[]).map(
      (p): Project => ({ ...p, clientName: "", clientEmail: "", phase: "uitvoering", budget: 0, startDate: "", deliveryDate: "", coverColors: [], rooms: [] }),
    );
  }

  const { data: markers, error } = await db.from("read_markers").select("project_id, at");
  if (error) throw error;
  next.lastRead = Object.fromEntries((markers ?? []).map((m) => [m.project_id, { [identity.role]: String(m.at).slice(0, 19) }]));
  return next;
}

// Vergelijk de state voor en na een wijziging en stuur de verschillen naar de database.
export async function pushChanges(prev: AppState, next: AppState) {
  const db = supabase!;
  const jobs: PromiseLike<{ error: unknown }>[] = [];

  for (const collection of Object.keys(tables) as Synced[]) {
    const before = prev[collection] as object[];
    const after = next[collection] as object[];
    if (before === after) continue;
    const key = keyOf(collection);
    const id = (item: object) => (item as Row)[key] as string;
    const oldById = new Map(before.map((item) => [id(item), item]));
    const newIds = new Set(after.map(id));
    const table = db.from(tables[collection]);

    for (const item of after) {
      const old = oldById.get(id(item));
      if (!old) {
        jobs.push(db.from(tables[collection]).insert(toRow(item)));
      } else if (old !== item) {
        const changed = [...new Set([...Object.keys(old), ...Object.keys(item)])].filter(
          (k) => JSON.stringify((old as Row)[k]) !== JSON.stringify((item as Row)[k]),
        );
        if (changed.length) jobs.push(db.from(tables[collection]).update(toRow(item, changed)).eq(snake(key), id(item)));
      }
    }
    for (const old of before) {
      if (!newIds.has(id(old))) jobs.push(table.delete().eq(snake(key), id(old)));
    }
  }

  if (prev.lastRead !== next.lastRead) {
    for (const [projectId, byRole] of Object.entries(next.lastRead)) {
      const at = byRole[next.role];
      if (at && at !== prev.lastRead[projectId]?.[next.role]) {
        jobs.push(db.from("read_markers").upsert({ project_id: projectId, at }));
      }
    }
  }

  const results = await Promise.all(jobs);
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;
}

// ---- Bestanden ----

export async function uploadDocument(projectId: string, docId: string, file: File) {
  const path = `${projectId}/${docId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const { error } = await supabase!.storage.from("documents").upload(path, file);
  if (error) throw error;
  return path;
}

export async function openDocument(path: string) {
  // Een tijdelijke link van 5 minuten; daarna moet je opnieuw op Bekijken klikken.
  const { data, error } = await supabase!.storage.from("documents").createSignedUrl(path, 300);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener");
}

// ---- Uitnodigen ----

// Stuurt een inloglink. Wie hem gebruikt, krijgt de rol die bij het
// e-mailadres hoort (klant van een project, of uitvoerder).
export async function sendInvite(email: string) {
  const { error } = await supabase!.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
  });
  if (error) throw error;
}
