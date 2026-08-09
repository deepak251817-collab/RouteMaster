import { useDroppable } from '@dnd-kit/core'

export default function GridCell({
  row,
  col,
  cellType,
  isTarget,
  isStart,
  onContextClear
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { row, col }
  })

  let colorClass = 'bg-white'
  if (cellType === 1) colorClass = 'bg-black'
  if (isTarget) colorClass = 'bg-sun'
  if (isStart) colorClass = 'bg-moss'

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`h-8 w-8 rounded-md border border-clay/40 ${colorClass} ${
        isOver ? 'ring-2 ring-ember' : ''
      }`}
      onContextMenu={(event) => {
        event.preventDefault()
        onContextClear(row, col)
      }}
    />
  )
}
