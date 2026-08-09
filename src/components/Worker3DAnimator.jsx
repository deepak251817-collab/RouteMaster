import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export default function Worker3DAnimator({
  path,
  offsetX,
  offsetZ,
  speedMs = 300,
  isPlaying,
  animationToken
}) {
  const meshRef = useRef(null)
  const segmentRef = useRef(0)
  const elapsedRef = useRef(0)

  const points = useMemo(() => {
    if (!path.length) {
      return []
    }
    return path.map(([row, col]) =>
      new THREE.Vector3(col - offsetX, 0.35, row - offsetZ)
    )
  }, [path, offsetX, offsetZ])

  useEffect(() => {
    segmentRef.current = 0
    elapsedRef.current = 0
    if (meshRef.current && points.length) {
      meshRef.current.position.copy(points[0])
    }
  }, [points, animationToken])

  useFrame((_, delta) => {
    if (!meshRef.current || points.length < 2) {
      return
    }
    if (!isPlaying) {
      return
    }

    const stepDuration = speedMs / 1000
    elapsedRef.current += delta

    while (elapsedRef.current >= stepDuration && segmentRef.current < points.length - 1) {
      elapsedRef.current -= stepDuration
      segmentRef.current += 1
    }

    const currentIndex = segmentRef.current
    const nextIndex = Math.min(currentIndex + 1, points.length - 1)
    const t = Math.min(elapsedRef.current / stepDuration, 1)
    const current = points[currentIndex]
    const next = points[nextIndex]

    meshRef.current.position.lerpVectors(current, next, t)
  })

  return (
    <mesh ref={meshRef} castShadow>
      <cylinderGeometry args={[0.18, 0.22, 0.7, 24]} />
      <meshStandardMaterial color="#1d4ed8" />
    </mesh>
  )
}
