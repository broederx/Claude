"use client";

import { useParams } from "next/navigation";
import { useAppState } from "./store";
import { demoClientEmail } from "./studio";
import type { AppState } from "./types";

export function visibleProjects(state: AppState) {
  if (state.role === "architect") return state.projects;
  if (state.role === "client") return state.projects.filter((p) => p.clientEmail === demoClientEmail);
  return [];
}

// Huidig project uit de URL, of undefined als het niet bestaat of de klant
// er geen toegang toe heeft.
export function useProject() {
  const { id } = useParams<{ id: string }>();
  const state = useAppState();
  const project = visibleProjects(state).find((p) => p.id === id);
  const scoped = <T extends { projectId: string }>(items: T[]) => items.filter((i) => i.projectId === id);
  return { state, project, role: state.role, scoped };
}
