export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border border-line bg-panel px-5 py-6">
      <p className="flex items-center gap-2 font-cond text-lg font-bold uppercase tracking-[0.04em] text-open">
        <span className="h-2 w-2 bg-open" aria-hidden />
        Something went wrong
      </p>
      <p className="mt-1.5 text-sm text-dim">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary mt-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, children }: { title: string; message?: string; children?: React.ReactNode }) {
  return (
    <div className="border border-line px-5 py-8 text-center">
      <p className="font-cond text-xl font-bold uppercase tracking-[0.04em] text-paper">{title}</p>
      {message && <p className="mt-1.5 text-sm text-dim">{message}</p>}
      {children}
    </div>
  );
}
