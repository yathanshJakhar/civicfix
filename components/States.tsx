export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-zinc-900 p-6 text-center">
      <p className="font-bold text-white">Something went wrong</p>
      <p className="mt-1 text-sm text-zinc-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 h-12 rounded-xl bg-violet-600 px-6 text-sm font-bold text-white hover:bg-violet-500 active:scale-95"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, children }: { title: string; message?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
      <p className="font-bold text-white">{title}</p>
      {message && <p className="mt-1 text-sm text-zinc-400">{message}</p>}
      {children}
    </div>
  );
}
