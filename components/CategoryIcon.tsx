import type { Category } from "@/lib/types";
import { CATEGORY_SVG } from "@/lib/categoryIcons";

export default function CategoryIcon({
  category,
  className = "h-4 w-4",
  strokeWidth = 2,
}: {
  category: Category;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: CATEGORY_SVG[category] }}
    />
  );
}
