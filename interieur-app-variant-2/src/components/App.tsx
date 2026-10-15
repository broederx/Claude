"use client";

import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import Shell from "@/components/Shell";
import ContractorHome from "@/views/ContractorHome";
import OwnerDashboard from "@/views/OwnerDashboard";
import ProjectView from "@/views/ProjectView";
import SupplierHome from "@/views/SupplierHome";
import { AllTasksPage, AuditPage, NotificationsPage, PeoplePage, ProductsLibraryPage, ProjectsPage, RightsPage } from "@/views/StudioPages";
import StudioOnly from "@/components/StudioOnly";

// Eén router voor de hele app; dezelfde code draait in Next en in de losse preview.
function Route() {
  const pathname = usePathname();
  const { user, projects } = useSession();
  const [first, second, third] = pathname.split("/").filter(Boolean);
  const owner = user.role === "owner";

  if (first === "projecten" && second) return <ProjectView projectId={second} tab={third} />;
  if (first === "meldingen") return <NotificationsPage />;
  const studioPages: Record<string, () => React.ReactNode> = {
    projecten: ProjectsPage,
    taken: AllTasksPage,
    producten: ProductsLibraryPage,
    mensen: PeoplePage,
    audit: AuditPage,
    rechten: RightsPage,
  };
  if (first && studioPages[first]) {
    const Page = studioPages[first];
    return owner ? <Page /> : <StudioOnly />;
  }

  if (owner) return <OwnerDashboard />;
  if (user.role === "contractor") return <ContractorHome />;
  if (user.role === "supplier") return <SupplierHome />;
  // Een klant komt direct in het eigen project.
  return projects[0] ? <ProjectView projectId={projects[0].id} /> : <StudioOnly />;
}

export default function App() {
  return (
    <Shell>
      <Route />
    </Shell>
  );
}
