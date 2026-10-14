export default function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-900 border-b border-zinc-800 bg-zinc-950 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="truncate text-sm text-zinc-400">{subtitle}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
