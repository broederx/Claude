import type { AppState, ProjectDoc } from "./types";

export const docCategories: Record<ProjectDoc["category"], string> = {
  tekening: "Tekening",
  "3d": "3D-impressie",
  contract: "Contract",
  advies: "Advies",
  overig: "Overig",
};

// Uitvoerders zien alleen documenten die de studio als definitief heeft
// aangemerkt.
export function contractorCanSee(doc: ProjectDoc) {
  return doc.final === true;
}

// Projecten waar de uitvoerder toegang toe heeft, met hun definitieve documenten.
export function contractorProjects(state: AppState, contractorId: string) {
  const contractor = state.contractors.find((c) => c.id === contractorId);
  if (!contractor) return [];
  return state.projects
    .filter((p) => contractor.projectIds.includes(p.id))
    .map((project) => ({
      project,
      docs: state.docs
        .filter((d) => d.projectId === project.id && contractorCanSee(d))
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    }));
}
