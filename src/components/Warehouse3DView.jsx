import { Canvas } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import Worker3DAnimator from './Worker3DAnimator.jsx'

function Floor({ rows, cols, offsetX, offsetZ }) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[cols, rows]} />
      <meshStandardMaterial color="#f1ede6" />
    </mesh>
  )
}

function Shelves({ obstacles, offsetX, offsetZ }) {
  return obstacles.map(([row, col]) => (
    <mesh
      key={`shelf-${row}-${col}`}
      position={[col - offsetX, 0.5, row - offsetZ]}
      castShadow
    >
      <boxGeometry args={[0.9, 1, 0.9]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
  ))
}

function Targets({ targets, offsetX, offsetZ }) {
  return targets.map(([row, col]) => (
    <mesh
      key={`target-${row}-${col}`}
      position={[col - offsetX, 0.4, row - offsetZ]}
      castShadow
    >
      <coneGeometry args={[0.3, 0.8, 18]} />
      <meshStandardMaterial color="#facc15" />
    </mesh>
  ))
}

export default function Warehouse3DView({
  baseGrid,
  targets,
  path,
  speedMs,
  isPlaying,
  animationToken
}) {
  const rows = baseGrid.length
  const cols = baseGrid[0].length
  const offsetX = (cols - 1) / 2
  const offsetZ = (rows - 1) / 2

  const obstacles = []
  baseGrid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === 1) {
        obstacles.push([rowIndex, colIndex])
      }
    })
  })

  const linePoints = path.map(([row, col]) => [col - offsetX, 0.15, row - offsetZ])

  return (
    <section className="rounded-3xl border border-clay/60 bg-white/85 p-5 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink dark:text-slate-100">3D Warehouse View</h2>
        <span className="text-xs uppercase tracking-[0.3em] text-ink/60 dark:text-slate-300">
          Orbit to explore
        </span>
      </div>
      <div className="mt-4 h-[420px] w-full overflow-hidden rounded-2xl border border-clay/50 dark:border-slate-700">
        <Canvas shadows camera={{ position: [6, 8, 8], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[6, 10, 4]} intensity={0.9} castShadow />
          <gridHelper args={[Math.max(rows, cols), Math.max(rows, cols), '#b8b1a4', '#c9c0b2']} />
          <Floor rows={rows} cols={cols} offsetX={offsetX} offsetZ={offsetZ} />
          <Shelves obstacles={obstacles} offsetX={offsetX} offsetZ={offsetZ} />
          <Targets targets={targets} offsetX={offsetX} offsetZ={offsetZ} />
          {linePoints.length > 1 ? (
            <Line points={linePoints} color="#2563eb" lineWidth={2} />
          ) : null}
          <Worker3DAnimator
            path={path}
            offsetX={offsetX}
            offsetZ={offsetZ}
            speedMs={speedMs}
            isPlaying={isPlaying}
            animationToken={animationToken}
          />
          <OrbitControls enablePan enableRotate enableZoom />
        </Canvas>
      </div>
    </section>
  )
}
