export default function JsonInput({
  value,
  onChange,
  onApply,
  onUpload,
  onDownload,
  error
}) {
  return (
    <section className="rounded-3xl border border-clay/60 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink dark:text-slate-100">JSON Input</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-ink px-4 py-1 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
            type="button"
            onClick={onUpload}
          >
            Upload JSON
          </button>
          <button
            className="rounded-full border border-ink px-4 py-1 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
            type="button"
            onClick={onDownload}
          >
            Download JSON
          </button>
          <button
            className="rounded-full bg-ember px-4 py-1 text-sm font-semibold text-white transition hover:brightness-95"
            type="button"
            onClick={onApply}
          >
            Apply JSON
          </button>
        </div>
      </div>
      <textarea
        className="mt-4 h-64 w-full rounded-2xl border border-clay/70 bg-mist/70 p-3 font-mono text-sm text-ink focus:border-ink focus:outline-none dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}
    </section>
  )
}
