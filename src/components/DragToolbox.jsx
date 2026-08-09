import { useDraggable } from '@dnd-kit/core'
import DraggableShelf from './DraggableShelf.jsx'
import DraggableTarget from './DraggableTarget.jsx'

function ToolboxItem({ id, label, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: id, source: 'toolbox' }
  })

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        ref={setNodeRef}
        type="button"
        className={`rounded-2xl border border-clay/60 bg-white/80 p-3 shadow-sm transition ${
          isDragging ? 'opacity-60' : ''
        } dark:border-slate-600 dark:bg-slate-900/80`}
        {...listeners}
        {...attributes}
      >
        {children}
      </button>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70 dark:text-slate-300">
        {label}
      </span>
    </div>
  )
}

export default function DragToolbox() {
  return (
    <section className="rounded-3xl border border-clay/60 bg-white/85 p-4 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink dark:text-slate-100">Drag Toolbox</h2>
        <span className="text-xs uppercase tracking-[0.3em] text-ink/60 dark:text-slate-300">
          Drop onto grid
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        <ToolboxItem id="shelf" label="Shelf">
          <DraggableShelf />
        </ToolboxItem>
        <ToolboxItem id="target" label="Target">
          <DraggableTarget />
        </ToolboxItem>
        <ToolboxItem id="start" label="Worker">
          <div className="h-10 w-10 rounded-full bg-moss" />
        </ToolboxItem>
        <ToolboxItem id="empty" label="Empty">
          <div className="h-10 w-10 rounded-lg border border-clay/60 bg-white" />
        </ToolboxItem>
      </div>
    </section>
  )
}
