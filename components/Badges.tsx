import type { Category, Status } from "@/lib/types";
import { STATUS_STYLES } from "@/lib/utils";
import CategoryIcon from "./CategoryIcon";

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-300 ring-1 ring-inset ring-violet-500/30">
      <CategoryIcon category={category} className="h-3.5 w-3.5" />
      {category}
    </span>
  );
}
