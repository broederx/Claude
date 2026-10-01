import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import Dashboard from "@/app/page";
import ProjectLayout from "@/app/projecten/[id]/layout";
import ProjectOverview from "@/app/projecten/[id]/page";
import MoodboardPage from "@/app/projecten/[id]/moodboard/page";
import WensenPage from "@/app/projecten/[id]/wensen/page";
import DocumentenPage from "@/app/projecten/[id]/documenten/page";
import ProductenPage from "@/app/projecten/[id]/producten/page";
import PlanningPage from "@/app/projecten/[id]/planning/page";
import BerichtenPage from "@/app/projecten/[id]/berichten/page";
import FinancienPage from "@/app/projecten/[id]/financien/page";
import InvoicePage from "@/app/projecten/[id]/financien/[invoiceId]/page";
import LeveranciersPage from "@/app/leveranciers/page";
import SupplierPage from "@/app/leveranciers/[supplierId]/page";
import { usePath } from "./shims/router";

const sections: Record<string, () => ReactNode> = {
  "": ProjectOverview,
  moodboard: MoodboardPage,
  wensen: WensenPage,
  documenten: DocumentenPage,
  producten: ProductenPage,
  planning: PlanningPage,
  berichten: BerichtenPage,
  financien: FinancienPage,
};

function Page() {
  const path = usePath();
  const [, first, second, section = "", invoiceId] = path.split("/");
  if (first === "leveranciers") return second ? <SupplierPage key={path} /> : <LeveranciersPage />;
  if (first !== "projecten") return <Dashboard />;
  const Section = invoiceId ? InvoicePage : (sections[section] ?? ProjectOverview);
  // De layout verwacht Next-props; in de preview halen alle pagina's hun
  // gegevens zelf op, dus params is alleen voor de typechecker.
  return (
    <ProjectLayout params={Promise.resolve({ id: "" })}>
      <Section key={path} />
    </ProjectLayout>
  );
}

createRoot(document.getElementById("root")!).render(
  <div className="min-h-full flex flex-col font-sans antialiased">
    <AppHeader />
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Page />
    </main>
  </div>,
);
