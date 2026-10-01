import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import AppHeader from "@/components/AppHeader";
import { studio } from "@/lib/studio";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${studio.name}: klantportaal`,
  description: "Eén plek voor ontwerp, keuzes, planning en facturen van je interieurproject.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={`${cormorant.variable} ${jost.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      </body>
    </html>
  );
}
