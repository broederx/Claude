export type Role = "owner" | "client" | "contractor" | "supplier";

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  company?: string;
  trade?: string;
  // Project-based access: alleen deze projecten bestaan voor deze gebruiker.
  projectIds: string[];
  // Tijdelijke toegang: daarna gaat het project automatisch dicht.
  accessUntil?: string;
  twoFactor: boolean;
}

export type Phase = "intake" | "ontwerp" | "offerte" | "uitvoering" | "oplevering";

export interface Intake {
  woningtype: string;
  ruimtes: string[];
  stijl: string[];
  budgetIndicatie: number;
  opleveringGewenst: string;
  focus: string[];
  mustHaves: string;
  donts: string;
  praktisch: string;
  huishouden: string;
  kinderen: boolean;
  huisdieren: boolean;
  thuiswerken: boolean;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  address: string;
  phase: Phase;
  budget: number;
  // Studio bepaalt of de klant het budget mag zien.
  showBudgetToClient: boolean;
  startDate: string;
  deliveryDate: string;
  rooms: string[];
  coverColors: string[];
  intake: Partial<Intake>;
  internal: { hourlyRate: number; hoursBudget: number; hoursSpent: number; bufferPct: number };
}

export interface MoodItem {
  id: string;
  projectId: string;
  room: string;
  title: string;
  kind: "kleur" | "materiaal" | "sfeer";
  colors: string[];
  note?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  description: string;
  colors: string[];
  priceDelta: number;
}

// Een ontwerpkeuze is altijd binair: kies A, B of C voor een deadline.
export interface Choice {
  id: string;
  projectId: string;
  room: string;
  question: string;
  deadline: string;
  options: ChoiceOption[];
  chosenOptionId?: string;
  decidedAt?: string;
}

export type ProductStatus = "voorgesteld" | "goedgekeurd" | "besteld" | "geleverd";
export type Party = "studio" | "client" | "contractor" | "supplier";

export interface Product {
  id: string;
  projectId: string;
  room: string;
  name: string;
  brand: string;
  supplierName: string;
  supplierUserId?: string;
  sku: string;
  price: number;
  purchasePrice: number;
  link?: string;
  leadTimeWeeks: number;
  expectedDelivery?: string;
  status: ProductStatus;
  actionBy: Party;
  color: string;
  // Field-level permissions per productregel.
  visibleToClient: boolean;
  visibleToContractor: boolean;
  supplierVisibleToClient: boolean;
  internalNote?: string;
  specFile?: string;
}

export type TaskStatus = "open" | "bezig" | "klaar";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assigneeId?: string;
  start: string;
  due: string;
  status: TaskStatus;
  dependsOn: string[];
  location?: string;
  photos: string[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  date: string;
  kind: "ontwerp" | "keuze" | "bestelling" | "levering" | "uitvoering" | "oplevering" | "facturatie";
  // Eén planning, verschillende weergaven.
  forClient: boolean;
  forContractor: boolean;
  done: boolean;
}

export type FileFolder =
  | "Intake"
  | "Ontwerp"
  | "Moodboards"
  | "Plattegronden"
  | "3D renders"
  | "Werktekeningen"
  | "Offertes"
  | "Facturen"
  | "Foto's"
  | "Oplevering"
  | "Intern";

export type VersionStatus = "concept" | "ter-akkoord" | "goedgekeurd" | "afgekeurd";

export interface FileVersion {
  version: number;
  uploadedAt: string;
  status: VersionStatus;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  folder: FileFolder;
  title: string;
  versions: FileVersion[];
  // Document permissions.
  visibleToClient: boolean;
  visibleToContractor: boolean;
  onlyUserIds?: string[];
  allowDownload: boolean;
  watermark: boolean;
  // Workflow: bij akkoord van de klant krijgen uitvoerders automatisch toegang.
  releaseOnApproval: boolean;
}

export type Channel = "intern" | "klant" | "uitvoerder" | "leverancier";
export type TargetType = "project" | "product" | "task" | "file" | "choice" | "room" | "budget" | "changeOrder";

export interface Comment {
  id: string;
  projectId: string;
  targetType: TargetType;
  targetId: string;
  channel: Channel;
  authorId: string;
  // Bij het uitvoerderkanaal: voor welke uitvoerder het bericht is.
  toUserId?: string;
  text: string;
  at: string;
}

export type ChangeOrderStatus = "gemeld" | "voorgesteld" | "geaccepteerd" | "geweigerd" | "afgewezen";

// Meerwerk: uitvoerder meldt, studio beoordeelt, klant beslist.
export interface ChangeOrder {
  id: string;
  projectId: string;
  reportedBy: string;
  title: string;
  description: string;
  amount: number;
  status: ChangeOrderStatus;
  at: string;
}

export interface Issue {
  id: string;
  projectId: string;
  taskId?: string;
  reportedBy: string;
  title: string;
  status: "open" | "opgelost";
  at: string;
}

export interface ContractorAgreement {
  projectId: string;
  contractorId: string;
  amount: number;
  scope: string;
}

export interface Decision {
  id: string;
  projectId: string;
  at: string;
  byUserId: string;
  subject: string;
  detail: string;
  consequence?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  userId: string;
  projectId?: string;
  action: "bekeken" | "gedownload" | "aangepast" | "goedgekeurd" | "afgekeurd" | "geüpload" | "verwijderd" | "uitgenodigd" | "toegang ingetrokken" | "gemeld";
  target: string;
}

export interface AppState {
  version: number;
  currentUserId: string;
  users: User[];
  projects: Project[];
  mood: MoodItem[];
  choices: Choice[];
  products: Product[];
  tasks: Task[];
  milestones: Milestone[];
  files: ProjectFile[];
  comments: Comment[];
  changeOrders: ChangeOrder[];
  issues: Issue[];
  agreements: ContractorAgreement[];
  decisions: Decision[];
  audit: AuditEntry[];
}
