export default function Modal({ title, isOpen, onClose, children }) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50"
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            onClose()
          }
        }}
      />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-clay/60 bg-white/95 p-6 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-ink dark:text-slate-100">{title}</h2>
          <button
            className="rounded-full border border-ink px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-ink hover:text-white dark:border-slate-400 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mt-4 max-h-[70vh] overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
