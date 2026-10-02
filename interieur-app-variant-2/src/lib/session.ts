"use client";

import { projectsFor } from "./access";
import { useAppState } from "./store";

// De ingelogde gebruiker in het prototype. In de echte app komt dit uit de
// inlog (met tweestapsverificatie voor de studio).
export function useSession() {
  const state = useAppState();
  const user = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];
  return { state, user, projects: projectsFor(state, user) };
}

export function useProjectData(projectId: string) {
  const session = useSession();
  const project = session.projects.find((p) => p.id === projectId)!;
  const scoped = <T extends { projectId: string }>(items: T[]) => items.filter((i) => i.projectId === projectId);
  return { ...session, project, scoped };
}
