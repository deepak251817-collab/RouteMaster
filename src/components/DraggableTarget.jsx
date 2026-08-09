export default function DraggableTarget({ size = 'md' }) {
  const dimensions = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return <div className={`${dimensions} rounded-lg bg-sun`} />
}
