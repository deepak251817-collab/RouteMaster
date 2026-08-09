import { useMemo } from 'react'

function toAisleLabel([row, col]) {
  const letter = String.fromCharCode(65 + (col % 26))
  return `${letter}${row + 1}`
}

export default function WorkerNavigationPanel({
  path,
  stepIndex,
  targets,
  isPlaying,
  onStart,
  onPause,
  onNext
}) {
  const targetsSet = useMemo(() => new Set(targets.map((t) => `${t[0]}-${t[1]}`)), [targets])

  const totalSteps = Math.max(path.length - 1, 0)
  const stepsRemaining = Math.max(totalSteps - stepIndex, 0)
  const current = path.length ? path[Math.min(stepIndex, path.length - 1)] : null
  const currentKey = current ? `${current[0]}-${current[1]}` : ''
  const targetsCollected = path
    .slice(0, Math.min(stepIndex + 1, path.length))
    .filter((point) => targetsSet.has(`${point[0]}-${point[1]}`)).length

  const stepInstruction = useMemo(() => {
    if (!current) {
      return 'Calculate a route to start navigation.'
    }
    const label = toAisleLabel(current)
    if (targetsSet.has(currentKey)) {
      return `Step ${stepIndex + 1} -> Pick item at aisle ${label}`
    }
    return `Step ${stepIndex + 1} -> Move to aisle ${label}`
  }, [current, currentKey, stepIndex, targetsSet])

  return (
    <section className="rounded-3xl border border-clay/60 bg-white/90 p-4 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <h2 className="text-lg font-semibold text-ink dark:text-slate-100">Worker Navigation</h2>
      <p className="mt-2 text-sm text-ink/70 dark:text-slate-300">{stepInstruction}</p>
      <div className="mt-4 grid gap-3 text-sm text-ink/80 dark:text-slate-200">
        <div className="flex items-center justify-between rounded-2xl bg-mist/80 p-3 dark:bg-slate-800/70">
          <span>Targets Collected</span>
          <span className="text-base font-semibold text-ink dark:text-slate-100">
            {targetsCollected}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-mist/80 p-3 dark:bg-slate-800/70">
          <span>Steps Remaining</span>
          <span className="text-base font-semibold text-ink dark:text-slate-100">
            {stepsRemaining}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-mist/80 p-3 dark:bg-slate-800/70">
          <span>Current Location</span>
          <span className="text-base font-semibold text-ink dark:text-slate-100">
            {current ? toAisleLabel(current) : '--'}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
          type="button"
          onClick={onStart}
          disabled={!path.length}
        >
          Start Route
        </button>
        <button
          className="rounded-full border border-ink px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900 disabled:opacity-60"
          type="button"
          onClick={onPause}
          disabled={!isPlaying}
        >
          Pause
        </button>
        <button
          className="rounded-full border border-ink px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900 disabled:opacity-60"
          type="button"
          onClick={onNext}
          disabled={!path.length}
        >
          Next Step
        </button>
      </div>
    </section>
  )
}
