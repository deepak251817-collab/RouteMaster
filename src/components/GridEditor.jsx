import { useEffect, useMemo, useState } from 'react'

const toolOptions = [
  { id: 'cycle', label: 'Cycle Cells' },
  { id: 'obstacle', label: 'Draw Obstacle' },
  { id: 'target', label: 'Place Target' },
  { id: 'start', label: 'Move Start' },
  { id: 'erase', label: 'Erase Cell' }
]

function keyFor(point) {
  return `${point[0]}-${point[1]}`
}

export default function GridEditor({
  baseGrid,
  start,
  targets,
  path,
  stepIndex,
  mode,
  onModeChange,
  onSetStart,
  onSetObstacle,
  onSetTarget,
  onClearCell,
  onResize,
  onExportJson
}) {
  const [dragging, setDragging] = useState(false)
  const [dragMode, setDragMode] = useState(null)
  const [hovered, setHovered] = useState(null)

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
  const [cellSize, setCellSize] = useState(28)
  const [workerSize, setWorkerSize] = useState(16)
  const cellGap = 4
  const gridPadding = 12

  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)')
    const applySize = (matches) => {
      if (matches) {
        setCellSize(34)
        setWorkerSize(18)
      } else {
        setCellSize(28)
        setWorkerSize(16)
      }
    }
    applySize(media.matches)
    const handler = (event) => applySize(event.matches)
    if (media.addEventListener) {
      media.addEventListener('change', handler)
    } else {
      media.addListener(handler)
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handler)
      } else {
        media.removeListener(handler)
      }
    }
  }, [])

  const cycleCell = (row, col) => {
    const isStart = start && start[0] === row && start[1] === col
    if (isStart) {
      return
    }
    const isObstacle = baseGrid[row][col] === 1
    const isTarget = targetSet.has(keyFor([row, col]))

    if (!isObstacle && !isTarget) {
      onSetObstacle(row, col, true)
      return
    }
    if (isObstacle) {
      onSetObstacle(row, col, false)
      onSetTarget(row, col, true)
      return
    }
    onSetTarget(row, col, false)
  }

  const handleCell = (row, col, action) => {
    const isStart = start && start[0] === row && start[1] === col
    const isTarget = targetSet.has(keyFor([row, col]))
    const isObstacle = baseGrid[row][col] === 1

    if (action === 'cycle') {
      cycleCell(row, col)
      return
    }

    if (action === 'start') {
      onSetStart(row, col)
      return
    }

    if (action === 'target') {
      if (isObstacle || isStart) {
        return
      }
      onSetTarget(row, col, !isTarget)
      return
    }

    if (action === 'obstacle') {
      if (isStart || isTarget) {
        return
      }
      onSetObstacle(row, col, !isObstacle)
      return
    }

    if (action === 'erase') {
      if (isStart) {
        return
      }
      onClearCell(row, col)
    }
  }

  const beginDrag = (row, col) => {
    setDragging(true)
    const nextMode = mode || 'cycle'
    setDragMode(nextMode)
    handleCell(row, col, nextMode)
  }

  const moveDrag = (row, col) => {
    if (!dragging || !dragMode) {
      return
    }
    handleCell(row, col, dragMode)
  }

  const stopDrag = () => {
    setDragging(false)
    setDragMode(null)
  }

  const handleResize = (event, axis) => {
    const value = Number(event.target.value)
    if (axis === 'rows') {
      onResize(value, cols)
    } else {
      onResize(rows, value)
    }
  }

  return (
    <section className="rounded-3xl border border-clay/60 bg-white/85 p-5 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink dark:text-slate-100">Interactive Grid Editor</h2>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-ink/70 dark:text-slate-300">
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
            <span className="h-3 w-3 rounded bg-moss" />
            Start
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
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {toolOptions.map((tool) => (
            <button
              key={tool.id}
              className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                mode === tool.id
                  ? 'bg-ink text-white'
                  : 'border border-ink text-ink hover:bg-ink hover:text-white dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900'
              }`}
              type="button"
              onClick={() => onModeChange(tool.id)}
            >
              {tool.label}
            </button>
          ))}
        </div>
        <button
          className="rounded-full bg-ember px-4 py-1 text-sm font-semibold text-white transition hover:brightness-95"
          type="button"
          onClick={onExportJson}
        >
          Export Grid JSON
        </button>
      </div>

        <div className="mt-4 grid gap-3 rounded-2xl border border-clay/50 bg-mist/70 p-4 text-sm text-ink/70 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 md:grid-cols-2">
        <label className="flex items-center justify-between gap-3">
          Rows: {rows}
          <input
            className="w-40 accent-ember"
              min="3"
              max="50"
            step="1"
            type="range"
            value={rows}
            onChange={(event) => handleResize(event, 'rows')}
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          Columns: {cols}
          <input
            className="w-40 accent-ember"
              min="3"
              max="50"
            step="1"
            type="range"
            value={cols}
            onChange={(event) => handleResize(event, 'cols')}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-ink/70 dark:text-slate-300">
        <span>{hovered ? `Hover: (${hovered[0]}, ${hovered[1]})` : 'Hover a cell to see coordinates.'}</span>
        <span>
          Size: {rows} x {cols}
        </span>
      </div>

      <div
        className="relative mt-5 max-h-[420px] overflow-auto rounded-2xl bg-clay/50 p-3 dark:bg-slate-800/60"
        onMouseLeave={() => {
          stopDrag()
          setHovered(null)
        }}
        onMouseUp={stopDrag}
      >
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, ${cellSize}px))` }}
        >
          {baseGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const key = `${rowIndex}-${colIndex}`
              const isStart = start && start[0] === rowIndex && start[1] === colIndex
              const isTarget = targetSet.has(keyFor([rowIndex, colIndex]))
              const isObstacle = cell === 1
              const isVisited = visitedSet.has(keyFor([rowIndex, colIndex]))
              const isCurrent = currentKey === keyFor([rowIndex, colIndex])
              const baseClass = 'h-7 w-7 rounded transition'

              let colorClass = 'bg-white dark:bg-slate-100'
              if (isObstacle) colorClass = 'bg-black'
              if (isTarget) colorClass = 'bg-sun'
              if (isVisited) colorClass = 'bg-sky-200 dark:bg-sky-400'
              if (isStart && !isCurrent) colorClass = 'bg-moss'
              if (isCurrent) colorClass = 'bg-blue-700 dark:bg-blue-400'

              return (
                <button
                  key={key}
                  className={`${baseClass} ${colorClass} focus:outline-none`}
                  type="button"
                  title={`(${rowIndex}, ${colIndex})`}
                  onMouseDown={() => beginDrag(rowIndex, colIndex)}
                  onMouseEnter={() => {
                    setHovered([rowIndex, colIndex])
                    moveDrag(rowIndex, colIndex)
                  }}
                />
              )
            })
          )}
        </div>
        {currentKey ? (
          <div
            className="pointer-events-none absolute rounded-full bg-white shadow-md dark:bg-slate-100"
            style={{
              width: `${workerSize}px`,
              height: `${workerSize}px`,
              left: `${gridPadding + Number(currentKey.split('-')[1]) * (cellSize + cellGap) +
                (cellSize - workerSize) / 2}px`,
              top: `${gridPadding + Number(currentKey.split('-')[0]) * (cellSize + cellGap) +
                (cellSize - workerSize) / 2}px`,
              transition: 'top 300ms ease, left 300ms ease'
            }}
          />
        ) : null}
      </div>
    </section>
  )
}
