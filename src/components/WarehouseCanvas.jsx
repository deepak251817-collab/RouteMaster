import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useMemo } from 'react'
import DraggableShelf from './DraggableShelf.jsx'
import DraggableTarget from './DraggableTarget.jsx'
import GridCell from './GridCell.jsx'

function DraggableGridItem({ id, children, data }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data })

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'opacity-40' : ''}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}

function TrashDropzone() {
  const { isOver, setNodeRef } = useDroppable({ id: 'trash' })
  return (
    <div
      ref={setNodeRef}
      className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-ink text-xs font-semibold uppercase tracking-[0.2em] text-ink transition dark:border-slate-400 dark:text-slate-200 ${
        isOver ? 'bg-ember text-white' : 'bg-white/70 dark:bg-slate-900/80'
      }`}
    >
      Trash
    </div>
  )
}

export default function WarehouseCanvas({
  baseGrid,
  start,
  targets,
  zoom,
  onZoomChange,
  onClearCell
}) {
  const targetSet = useMemo(() => new Set(targets.map((t) => `${t[0]}-${t[1]}`)), [targets])

  const rows = baseGrid.length
  const cols = baseGrid[0].length

  return (
    <section className="rounded-3xl border border-clay/60 bg-white/85 p-4 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink dark:text-slate-100">Warehouse Canvas</h2>
        <div className="flex flex-wrap items-center gap-4 text-xs text-ink/70 dark:text-slate-300">
          <label className="flex items-center gap-2">
            Zoom
            <input
              className="w-28 accent-ember"
              min="0.6"
              max="1.6"
              step="0.05"
              type="range"
              value={zoom}
              onChange={(event) => onZoomChange(Number(event.target.value))}
            />
          </label>
          <TrashDropzone />
        </div>
      </div>
      <div className="mt-4 max-h-[480px] overflow-auto rounded-2xl border border-clay/50 bg-mist/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 32px))`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          {baseGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isTarget = targetSet.has(`${rowIndex}-${colIndex}`)
                const isStart = start && start[0] === rowIndex && start[1] === colIndex
              const cellType = cell

              return (
                <div key={`${rowIndex}-${colIndex}`} className="relative">
                  <GridCell
                    row={rowIndex}
                    col={colIndex}
                    cellType={cellType}
                    isTarget={isTarget}
                    isStart={isStart}
                    onContextClear={onClearCell}
                  />
                  {cellType === 1 ? (
                    <DraggableGridItem
                      id={`shelf-${rowIndex}-${colIndex}`}
                      data={{ type: 'shelf', origin: { row: rowIndex, col: colIndex } }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <DraggableShelf size="sm" />
                      </div>
                    </DraggableGridItem>
                  ) : null}
                  {isTarget ? (
                    <DraggableGridItem
                      id={`target-${rowIndex}-${colIndex}`}
                      data={{ type: 'target', origin: { row: rowIndex, col: colIndex } }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <DraggableTarget size="sm" />
                      </div>
                    </DraggableGridItem>
                  ) : null}
                  {isStart ? (
                    <DraggableGridItem
                      id={`start-${rowIndex}-${colIndex}`}
                      data={{ type: 'start', origin: { row: rowIndex, col: colIndex } }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full bg-moss" />
                      </div>
                    </DraggableGridItem>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </div>
      <p className="mt-4 text-sm text-ink/70 dark:text-slate-300">
        Drag shelves, targets, or the worker onto the grid. Right-click to clear a cell or drop onto
        the trash.
      </p>
    </section>
  )
}
