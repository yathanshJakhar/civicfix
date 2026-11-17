import type { Category, Status } from "@/lib/types";
import { STATUS_STYLES } from "@/lib/utils";
import CategoryIcon from "./CategoryIcon";

/** `nowrap` keeps a board row's status on one line; ticket segments let it wrap inside their column. */
export function StatusBadge({ status, className = "", nowrap = false }: { status: Status; className?: string; nowrap?: boolean }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-start gap-1.5 ${nowrap ? "whitespace-nowrap" : ""} font-cond text-[13px] font-bold uppercase leading-tight tracking-[0.06em] ${s.text} ${className}`}
    >
      <span className={`mt-[0.3em] h-2 w-2 shrink-0 ${s.mark}`} aria-hidden />
      {status}
    </span>
  );
}

export function CategoryBadge({ category, className = "" }: { category: Category; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-cond text-[13px] font-semibold uppercase tracking-[0.08em] text-dim ${className}`}>
      <CategoryIcon category={category} className="h-4 w-4" />
      {category}
    </span>
  );
}

/** Marigold flag for an issue whose status moved since this device last opened it. */
export function ChangedChip({ status }: { status: Status }) {
  return (
    <span className="inline-block whitespace-nowrap bg-marigold px-1 py-1 font-cond text-[11px] font-bold uppercase leading-tight tracking-[0.02em] text-ground">
      Now {status}
    </span>
  );
}
