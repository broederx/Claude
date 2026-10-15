"use client";

import { useSyncExternalStore } from "react";
import { localIso } from "./format";
import { pushChanges } from "./remote";
import { seed, STATE_VERSION } from "./seed";
import { isLive } from "./supabase";
import type { AppState } from "./types";

// Twee standen:
// - demo: voorbeelddata, alles bewaard in deze browser (localStorage);
// - live: data uit Supabase; elke wijziging gaat direct naar de database.
const STORAGE_KEY = "mim-portal-state";

export const emptyState: AppState = {
  version: STATE_VERSION,
  role: "client",
  contractorView: "",
  projects: [],
  mood: [],
  briefings: [],
  docs: [],
  products: [],
  milestones: [],
  messages: [],
  invoices: [],
  contractors: [],
  choices: [],
  decisions: [],
  lastRead: {},
};

let state: AppState = isLive ? emptyState : seed;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

// Fouten bij het opslaan in de database; de app toont ze als melding.
let syncError: string | null = null;
let onSyncFailed: (() => void) | null = null;

function load() {
  if (loaded || typeof window === "undefined" || isLive) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version === STATE_VERSION) state = parsed;
  } catch {
    // Geen opslag beschikbaar: we werken met de voorbeelddata.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return state;
}

function getServerSnapshot() {
  return isLive ? emptyState : seed;
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setAppState(update: (current: AppState) => AppState) {
  load();
  const prev = state;
  state = update(state);
  emit();
  if (isLive) {
    pushChanges(prev, state).catch((error: { code?: string }) => {
      // 42501: de database weigert het op grond van de rechten.
      syncError = error?.code === "42501"
        ? "Dit mag je niet wijzigen. De laatste stand is opnieuw geladen."
        : "Opslaan is niet gelukt. Controleer je internetverbinding; de laatste stand is opnieuw geladen.";
      emit();
      onSyncFailed?.();
    });
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Negeer: de wijziging blijft in elk geval tot de pagina herlaadt.
  }
}

// Data uit de database overnemen, zonder die terug te sturen.
export function replaceState(next: AppState) {
  state = next;
  emit();
}

export function useSyncError() {
  return useSyncExternalStore(subscribe, () => syncError, () => null);
}

export function clearSyncError() {
  syncError = null;
  emit();
}

export function setSyncFailedHandler(handler: (() => void) | null) {
  onSyncFailed = handler;
}

export function resetAppState() {
  setAppState(() => ({ ...seed, role: state.role }));
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function nowIso() {
  return localIso();
}
