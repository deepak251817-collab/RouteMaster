import { useEffect } from 'react'

export default function PathAnimator({
  path,
  isPlaying,
  speed,
  stepIndex,
  onStepChange,
  onStart,
  onPause,
  onResume,
  onReset
}) {
  const hasPath = path.length > 0
  const canResume = stepIndex > 0 && stepIndex < path.length - 1
  const totalSteps = Math.max(path.length - 1, 0)
  const currentStep = Math.min(stepIndex, totalSteps)
  const progress = totalSteps ? Math.round((currentStep / totalSteps) * 100) : 0
  const currentPoint = hasPath ? path[currentStep] : null
  const status = !hasPath
    ? 'Waiting for route'
    : isPlaying
      ? 'Playing'
      : currentStep === totalSteps
        ? 'Completed'
        : 'Paused'

  useEffect(() => {
    if (!isPlaying || !hasPath) {
      return undefined
    }

    const timer = setTimeout(() => {
      onStepChange((prev) => {
        const next = prev + 1
        if (next >= path.length) {
          onPause()
          return prev
        }
        return next
      })
    }, speed)

    return () => clearTimeout(timer)
  }, [isPlaying, hasPath, path.length, speed, stepIndex, onStepChange, onPause])

  return (
    <section className="rounded-3xl border border-clay/60 bg-white/85 p-5 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink dark:text-slate-100">Path Playback</h2>
          <p className="text-sm text-ink/60 dark:text-slate-300">Scrub the route with the controls below.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-clay/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/70 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
          <span
            className={`h-2 w-2 rounded-full ${
              isPlaying ? 'bg-ember animate-pulse' : hasPath ? 'bg-moss' : 'bg-clay'
            }`}
          />
          {status}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/70 dark:text-slate-300">
        <span>
          Step {hasPath ? currentStep + 1 : 0} / {Math.max(totalSteps + 1, 0)}
        </span>
        <span>{currentPoint ? `Position: ${currentPoint[0]},${currentPoint[1]}` : 'No position'}</span>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-clay/40 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-ember transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-full border border-clay/60 bg-white/80 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ember text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={onStart}
          disabled={!hasPath}
          aria-label="Start animation"
          title="Start"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" d="M7 5.5a1 1 0 0 1 1.5-.86l9 6a1 1 0 0 1 0 1.72l-9 6A1 1 0 0 1 7 17.5v-12Z" />
          </svg>
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
          type="button"
          onClick={onPause}
          disabled={!isPlaying}
          aria-label="Pause animation"
          title="Pause"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" d="M7.5 5A1.5 1.5 0 0 1 9 6.5v11A1.5 1.5 0 0 1 7.5 19h-1A1.5 1.5 0 0 1 5 17.5v-11A1.5 1.5 0 0 1 6.5 5h1Zm10 0A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 16.5 5h1Z" />
          </svg>
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
          type="button"
          onClick={onResume}
          disabled={!canResume || isPlaying}
          aria-label="Resume animation"
          title="Resume"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" d="M7 5.5a1 1 0 0 1 1.5-.86l9 6a1 1 0 0 1 0 1.72l-9 6A1 1 0 0 1 7 17.5v-12Z" />
          </svg>
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
          type="button"
          onClick={onReset}
          disabled={!hasPath}
          aria-label="Reset animation"
          title="Reset"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" d="M12 5a7 7 0 0 1 6.64 9H20a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1v-4a1 1 0 1 1 2 0v1.07A5 5 0 1 0 12 17a5 5 0 0 0 3.9-1.87 1 1 0 1 1 1.56 1.25A7 7 0 1 1 12 5Z" />
          </svg>
        </button>
      </div>
    </section>
  )
}
