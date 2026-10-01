"use client";

import { useSyncExternalStore } from "react";
import { seed, STATE_VERSION } from "./seed";
import type { AppState } from "./types";

// Prototype-opslag: alles staat in de browser (localStorage). In de echte app
// komt hier een database met inlog voor studio en klant voor in de plaats.
const STORAGE_KEY = "mim-portal-state";

let state: AppState = seed;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
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
  return seed;
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setAppState(update: (current: AppState) => AppState) {
  load();
  state = update(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Negeer: de wijziging blijft in elk geval tot de pagina herlaadt.
  }
  listeners.forEach((listener) => listener());
}

export function resetAppState() {
  setAppState(() => ({ ...seed, role: state.role }));
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function nowIso() {
  return new Date().toISOString().slice(0, 19);
}
