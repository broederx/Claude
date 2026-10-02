import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-foreground text-background hover:bg-foreground/85",
  secondary: "border border-border bg-surface text-foreground hover:border-foreground/40",
  ghost: "text-muted hover:text-foreground",
};

export function buttonClass(variant: Variant = "primary") {
  return `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm tracking-wide transition-colors disabled:opacity-40 disabled:pointer-events-none ${variants[variant]}`;
}

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={`${buttonClass(variant)} ${className}`} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-2xl border border-border bg-surface ${className}`} {...props} />;
}

const tones = {
  neutral: "bg-stone/40 text-foreground/80",
  accent: "bg-accent/15 text-accent",
  sage: "bg-sage/15 text-sage",
  warn: "bg-warn/15 text-warn",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, intro, action }: { title: string; intro?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-serif text-3xl font-light">{title}</h2>
        {intro && <p className="mt-2 max-w-2xl text-sm text-muted">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function Swatches({ colors, className = "h-24" }: { colors: string[]; className?: string }) {
  return (
    <div className={`flex overflow-hidden ${className}`}>
      {colors.map((color, i) => (
        <div key={`${color}-${i}`} className="flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">{children}</p>;
}

export const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/50";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-xs uppercase tracking-[0.2em] text-muted">{children}</h2>
      {aside}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-2 text-sm ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "warn" | "sage" }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-muted">{label}</p>
      <p className={`mt-1 font-serif text-2xl tabular-nums ${tone === "warn" ? "text-warn" : tone === "sage" ? "text-sage" : ""}`}>{value}</p>
    </Card>
  );
}
