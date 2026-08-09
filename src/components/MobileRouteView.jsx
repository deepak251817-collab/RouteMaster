import { useMemo } from 'react'

function keyFor(point) {
  return `${point[0]}-${point[1]}`
}

export default function MobileRouteView({
  baseGrid,
  targets,
  path,
  stepIndex,
  zoom,
  onZoomChange
}) {
  const targetSet = useMemo(() => new Set(targets.map(keyFor)), [targets])
  const visitedSet = useMemo(() => {
    if (!path.length || stepIndex <= 0) {
      return new Set()
    }
    return new Set(path.slice(0, stepIndex).map(keyFor))
  }, [path, stepIndex])
  const currentKey = useMemo(() => {
    if (!path.length) {
      return null
    }
    return keyFor(path[Math.min(stepIndex, path.length - 1)])
  }, [path, stepIndex])

  const rows = baseGrid.length
  const cols = baseGrid[0].length
  const cellSize = 34

  return (
    <section className="rounded-3xl border border-clay/60 bg-white/85 p-4 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink dark:text-slate-100">Worker Map</h2>
        <span className="text-xs uppercase tracking-[0.3em] text-ink/60 dark:text-slate-300">
          Mobile Mode
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-ink/70 dark:text-slate-300">
        <span>Zoom</span>
        <input
          className="w-32 accent-ember"
          min="0.6"
          max="1.6"
          step="0.05"
          type="range"
          value={zoom}
          onChange={(event) => onZoomChange(Number(event.target.value))}
        />
        <span>{Math.round(zoom * 100)}%</span>
      </div>
      <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-clay/50 bg-mist/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, ${cellSize}px))`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          {baseGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const key = `${rowIndex}-${colIndex}`
              const isTarget = targetSet.has(keyFor([rowIndex, colIndex]))
              const isObstacle = cell === 1
              const isVisited = visitedSet.has(keyFor([rowIndex, colIndex]))
              const isCurrent = currentKey === keyFor([rowIndex, colIndex])
              const baseClass = 'h-8 w-8 rounded'

              let colorClass = 'bg-white dark:bg-slate-100'
              if (isObstacle) colorClass = 'bg-black'
              if (isTarget) colorClass = 'bg-sun'
              if (isVisited) colorClass = 'bg-sky-200 dark:bg-sky-400'
              if (isCurrent) colorClass = 'bg-blue-700 dark:bg-blue-400'

              return <div key={key} className={`${baseClass} ${colorClass}`} />
            })
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-ink/70 dark:text-slate-300">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-clay bg-white dark:border-slate-500 dark:bg-slate-100" />
          Walkable
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-black" />
          Obstacle
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-sun" />
          Target
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-sky-200 dark:bg-sky-400" />
          Visited
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-blue-700 dark:bg-blue-400" />
          Current
        </span>
      </div>
    </section>
  )
}
