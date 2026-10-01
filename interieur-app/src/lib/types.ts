export type Role = "architect" | "client";

export type Phase =
  | "kennismaking"
  | "pve"
  | "schetsontwerp"
  | "definitief"
  | "uitvoering"
  | "oplevering";

export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  address: string;
  phase: Phase;
  budget: number;
  startDate: string;
  deliveryDate: string;
  coverColors: string[];
  rooms: string[];
}

export interface Comment {
  id: string;
  author: Role;
  text: string;
  at: string;
}

export type Reaction = "love" | "maybe" | "no";

export interface MoodItem {
  id: string;
  projectId: string;
  title: string;
  room: string;
  kind: "kleur" | "materiaal" | "inspiratie";
  colors: string[];
  imageUrl?: string;
  note?: string;
  addedBy: Role;
  reaction?: Reaction;
  comments: Comment[];
}

export interface Briefing {
  projectId: string;
  answers: Record<string, string | string[]>;
  updatedAt?: string;
}

export type DocStatus = "info" | "ter-goedkeuring" | "goedgekeurd" | "wijziging-gevraagd";

export interface ProjectDoc {
  id: string;
  projectId: string;
  title: string;
  category: "tekening" | "3d" | "contract" | "advies" | "overig";
  version: number;
  fileName: string;
  sizeKb: number;
  uploadedAt: string;
  status: DocStatus;
  feedback?: string;
}

export type ProductStatus = "voorstel" | "goedgekeurd" | "afgewezen" | "besteld" | "geleverd";

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  accountNumber?: string;
  discountPct: number;
  terms?: string;
  notes?: string;
}

export type OrderStatus = "verstuurd" | "bevestigd" | "geleverd";

// Inkooporder van de studio bij een leverancier. Klanten zien deze nooit.
export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  projectId: string;
  productIds: string[];
  date: string;
  expectedDelivery?: string;
  deliverTo: "project" | "studio";
  status: OrderStatus;
}

export interface Product {
  id: string;
  projectId: string;
  room: string;
  name: string;
  // Alleen zichtbaar voor de studio: leverancier en inkoopprijs.
  supplierId: string;
  purchasePrice: number;
  price: number;
  qty: number;
  leadTimeWeeks: number;
  status: ProductStatus;
  color: string;
  link?: string;
  clientNote?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  date: string;
  type: "mijlpaal" | "afspraak" | "levering";
  location?: string;
  done: boolean;
}

export interface Message {
  id: string;
  projectId: string;
  author: Role;
  text: string;
  at: string;
}

export interface InvoiceLine {
  description: string;
  qty: number;
  unitPrice: number;
}

export type InvoiceStatus = "concept" | "verzonden" | "geaccepteerd" | "betaald" | "vervallen";

export interface Invoice {
  id: string;
  projectId: string;
  kind: "offerte" | "factuur";
  number: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  vatRate: number;
  lines: InvoiceLine[];
}

export interface AppState {
  version: number;
  role: Role;
  projects: Project[];
  mood: MoodItem[];
  briefings: Briefing[];
  docs: ProjectDoc[];
  products: Product[];
  milestones: Milestone[];
  messages: Message[];
  invoices: Invoice[];
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  lastRead: Record<string, Record<Role, string>>;
}
