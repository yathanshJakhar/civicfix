export default function PageHeader({
  title,
  subtitle,
  children,
  display = false,
}: {
  title: string;
  /** The board's wordmark: gate-board scale instead of a page title. */
  display?: boolean;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-900 border-b border-line bg-ground px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1
            className={`truncate font-cond font-bold uppercase leading-none text-paper ${
              display ? "text-[2.5rem] tracking-[-0.01em]" : "text-[1.75rem] tracking-[0.02em]"
            }`}
          >
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 truncate text-sm text-dim">{subtitle}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
