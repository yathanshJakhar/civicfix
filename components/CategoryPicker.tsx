import CategoryIcon from "@/components/CategoryIcon";
import { CATEGORIES, type Category } from "@/lib/types";

/** Grid of category buttons, used by the report form fallback and the ticket's "Change category". */
export default function CategoryPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: Category | "";
  onChange: (c: Category) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 border-l border-t border-line-strong">
      {CATEGORIES.map((c) => {
        const on = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            disabled={disabled}
            aria-pressed={on}
            className={`flex min-h-18 flex-col items-center justify-center gap-1.5 border-b border-r border-line-strong px-1 py-2 ${c === "Other" ? "col-span-2" : ""} text-center font-cond text-[13px] font-semibold uppercase leading-tight tracking-[0.04em] transition-colors disabled:opacity-60 ${
              on ? "bg-marigold text-ink" : "bg-panel text-ink hover:bg-raised"
            }`}
          >
            <CategoryIcon category={c} className="h-5 w-5" />
            {c}
          </button>
        );
      })}
    </div>
  );
}
