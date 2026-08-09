import { useEffect, useMemo, useState } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import GridEditor from './components/GridEditor.jsx'
import JsonInput from './components/JsonInput.jsx'
import PathAnimator from './components/PathAnimator.jsx'
import Warehouse3DView from './components/Warehouse3DView.jsx'
import MobileRouteView from './components/MobileRouteView.jsx'
import WorkerNavigationPanel from './components/WorkerNavigationPanel.jsx'
import DragToolbox from './components/DragToolbox.jsx'
import WarehouseCanvas from './components/WarehouseCanvas.jsx'
import VoiceControl from './components/VoiceControl.jsx'
import Modal from './components/Modal.jsx'

const defaultRows = 3
const defaultCols = 3

const emptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))

const toKey = (row, col) => `${row}-${col}`

function buildJsonFromState(baseGrid, start, targets) {
  const grid = baseGrid.map((row) => row.slice())
  targets.forEach(([row, col]) => {
    if (grid[row] && grid[row][col] !== undefined) {
      grid[row][col] = 2
    }
  })
  return JSON.stringify({ grid, start, targets }, null, 2)
}

function parsePayload(raw) {
  let payload
  try {
    payload = JSON.parse(raw)
  } catch (error) {
    throw new Error('Invalid JSON format')
  }

  if (!Array.isArray(payload.grid) || payload.grid.length === 0) {
    throw new Error('Grid must be a non-empty 2D array')
  }
  const rows = payload.grid.length
  const cols = payload.grid[0].length
  if (payload.grid.some((row) => !Array.isArray(row) || row.length !== cols)) {
    throw new Error('Grid rows must be the same length')
  }

  const start = Array.isArray(payload.start) ? payload.start : null
  if (start && start.length !== 2) {
    throw new Error('Start must be a coordinate pair')
  }

  const targets = Array.isArray(payload.targets) ? payload.targets : []

  const baseGrid = payload.grid.map((row) =>
    row.map((cell) => (cell === 1 ? 1 : 0))
  )

  const detectedTargets = []
  payload.grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === 2) {
        detectedTargets.push([rowIndex, colIndex])
      }
    })
  })

  const finalTargets = targets.length ? targets : detectedTargets

  const inBounds = (point) =>
    point[0] >= 0 && point[0] < rows && point[1] >= 0 && point[1] < cols

  if (start) {
    if (!inBounds(start)) {
      throw new Error('Start is outside the grid')
    }
    if (baseGrid[start[0]][start[1]] === 1) {
      throw new Error('Start cannot be on an obstacle')
    }
  }

  finalTargets.forEach((target) => {
    if (!inBounds(target)) {
      throw new Error('Target is outside the grid')
    }
    if (baseGrid[target[0]][target[1]] === 1) {
      throw new Error('Target cannot be on an obstacle')
    }
  })

  return {
    baseGrid,
    start,
    targets: finalTargets,
    rows,
    cols
  }
}

export default function App() {
  const [baseGrid, setBaseGrid] = useState(() => emptyGrid(defaultRows, defaultCols))
  const [start, setStart] = useState(null)
  const [targets, setTargets] = useState([])
  const [jsonText, setJsonText] = useState(
    JSON.stringify({ grid: emptyGrid(defaultRows, defaultCols), start: null, targets: [] }, null, 2)
  )
  const [mode, setMode] = useState('cycle')
  const [path, setPath] = useState([])
  const [stepIndex, setStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const animationSpeed = 450
  const [metrics, setMetrics] = useState({ total_steps: 0, targets_collected: 0 })
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [viewMode, setViewMode] = useState('2d')
  const [workerMode, setWorkerMode] = useState(false)
  const [layoutMode, setLayoutMode] = useState('paint')
  const [zoom, setZoom] = useState(1)
  const [activeDragItem, setActiveDragItem] = useState(null)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const voiceReplyEnabled = true
  const [isJsonOpen, setIsJsonOpen] = useState(false)
  const [animationToken, setAnimationToken] = useState(0)
  const [voiceFeedback, setVoiceFeedback] = useState('')

  const cacheKey = 'routemasterRouteCache'
  const layoutKey = 'routemasterLayout'

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    if (!workerMode) {
      return
    }
    setViewMode('2d')
  }, [workerMode])

  useEffect(() => {
    if (layoutMode !== 'drag') {
      return
    }
    setJsonText(buildJsonFromState(baseGrid, start, targets))
  }, [layoutMode, baseGrid, start, targets])

  useEffect(() => {
    const cachedLayout = localStorage.getItem(layoutKey)
    if (!cachedLayout) {
      return
    }
    try {
      const parsed = JSON.parse(cachedLayout)
      if (parsed.baseGrid && parsed.targets) {
        setBaseGrid(parsed.baseGrid)
        setStart(parsed.start ?? null)
        setTargets(parsed.targets)
        setJsonText(buildJsonFromState(parsed.baseGrid, parsed.start ?? null, parsed.targets))
      }
    } catch (err) {
      localStorage.removeItem(layoutKey)
    }
  }, [layoutKey])

  useEffect(() => {
    localStorage.setItem(
      layoutKey,
      JSON.stringify({
        baseGrid,
        start,
        targets
      })
    )
  }, [layoutKey, baseGrid, start, targets])

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey)
    if (!cached || path.length) {
      return
    }
    try {
      const parsed = JSON.parse(cached)
      if (parsed.baseGrid && parsed.targets && parsed.path) {
        setBaseGrid(parsed.baseGrid)
        setStart(parsed.start ?? null)
        setTargets(parsed.targets)
        setPath(parsed.path)
        setMetrics(parsed.metrics || { total_steps: 0, targets_collected: 0 })
        setJsonText(buildJsonFromState(parsed.baseGrid, parsed.start ?? null, parsed.targets))
      }
    } catch (err) {
      localStorage.removeItem(cacheKey)
    }
  }, [cacheKey, path.length])

  const routeTravelled = useMemo(() => {
    if (!path.length) {
      return ''
    }
    return path.map(([row, col]) => `${row},${col}`).join(' -> ')
  }, [path])

  const handleDownloadJson = () => {
    const json = buildJsonFromState(baseGrid, start, targets)
    setJsonText(json)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'routemaster-layout.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const handleUploadJson = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (event) => {
      const file = event.target.files?.[0]
      if (!file) {
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result
        if (typeof text === 'string') {
          setJsonText(text)
          setError('')
          try {
            const parsed = parsePayload(text)
            setBaseGrid(parsed.baseGrid)
            setStart(parsed.start)
            setTargets(parsed.targets)
            setPath([])
            setStepIndex(0)
            setIsPlaying(false)
            setMetrics({ total_steps: 0, targets_collected: 0 })
            localStorage.removeItem(cacheKey)
          } catch (err) {
            setError(err.message)
          }
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleApplyJson = () => {
    try {
      const parsed = parsePayload(jsonText)
      setBaseGrid(parsed.baseGrid)
      setStart(parsed.start)
      setTargets(parsed.targets)
      setJsonText(buildJsonFromState(parsed.baseGrid, parsed.start, parsed.targets))
      setPath([])
      setStepIndex(0)
      setIsPlaying(false)
      setMetrics({ total_steps: 0, targets_collected: 0 })
      setError('')
      localStorage.removeItem(cacheKey)
    } catch (err) {
      setError(err.message)
    }
  }

  const setObstacleAt = (row, col, value) => {
    setBaseGrid((prev) => {
      const next = prev.map((gridRow) => gridRow.slice())
      next[row][col] = value ? 1 : 0
      return next
    })
    if (value) {
      setTargets((prev) => prev.filter(([r, c]) => !(r === row && c === col)))
    }
  }

  const clearCell = (row, col) => {
    setBaseGrid((prev) => {
      const next = prev.map((gridRow) => gridRow.slice())
      next[row][col] = 0
      return next
    })
    setTargets((prev) => prev.filter(([r, c]) => !(r === row && c === col)))
  }

  const setStartAt = (row, col) => {
    if (baseGrid[row][col] === 1) {
      return
    }
    setStart([row, col])
    setTargets((prev) => prev.filter(([r, c]) => !(r === row && c === col)))
  }

  const setTargetAt = (row, col, value) => {
    if (value) {
      setTargets((prev) => {
        if (prev.some(([r, c]) => r === row && c === col)) {
          return prev
        }
        return [...prev, [row, col]]
      })
      setBaseGrid((prev) => {
        const next = prev.map((gridRow) => gridRow.slice())
        next[row][col] = 0
        return next
      })
    } else {
      setTargets((prev) => prev.filter(([r, c]) => !(r === row && c === col)))
    }
  }

  const resetPath = () => {
    setPath([])
    setStepIndex(0)
    setIsPlaying(false)
    setMetrics({ total_steps: 0, targets_collected: 0 })
  }

  const handleCalculateRoute = async () => {
    setApiError('')
    setError('')
    setIsPlaying(false)
    setStepIndex(0)

    if (!start) {
      setApiError('Please place a start position before calculating a route.')
      return
    }
    if (!targets.length) {
      setApiError('Please add at least one target before calculating a route.')
      return
    }

    const payload = JSON.parse(buildJsonFromState(baseGrid, start, targets))

    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const detail = await response.json()
        throw new Error(detail.detail || 'Unable to calculate route')
      }

      const data = await response.json()
      setPath(data.path || [])
      setMetrics({
        total_steps: data.total_steps || 0,
        targets_collected: data.targets_collected || 0
      })
      setAnimationToken((prev) => prev + 1)
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          baseGrid,
          start,
          targets,
          path: data.path || [],
          metrics: {
            total_steps: data.total_steps || 0,
            targets_collected: data.targets_collected || 0
          }
        })
      )
      setIsPlaying(true)
    } catch (err) {
      setApiError(err.message)
      resetPath()
    }
  }

  const handleStartAnimation = () => {
    if (!path.length) {
      return
    }
    setAnimationToken((prev) => prev + 1)
    setStepIndex(0)
    setIsPlaying(true)
  }

  const handlePauseAnimation = () => {
    setIsPlaying(false)
  }

  const handleResumeAnimation = () => {
    if (!path.length) {
      return
    }
    setIsPlaying(true)
  }

  const handleResetAnimation = () => {
    setStepIndex(0)
    setIsPlaying(false)
    setAnimationToken((prev) => prev + 1)
  }

  const handleDragStart = (event) => {
    setActiveDragItem(event.active.data.current)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    const data = active.data.current
    setActiveDragItem(null)

    if (!data || !over) {
      return
    }

    if (over.id === 'trash') {
      if (data.origin) {
        clearCell(data.origin.row, data.origin.col)
      }
      return
    }

    if (typeof over.id === 'string' && over.id.startsWith('cell-')) {
      const parts = over.id.replace('cell-', '').split('-')
      const row = Number(parts[0])
      const col = Number(parts[1])

      if (data.origin) {
        clearCell(data.origin.row, data.origin.col)
      }

      if (data.type === 'shelf') {
        setObstacleAt(row, col, true)
      } else if (data.type === 'target') {
        setTargetAt(row, col, true)
      } else if (data.type === 'start') {
        setStartAt(row, col)
      } else if (data.type === 'empty') {
        clearCell(row, col)
      }
    }
  }

  const handleNextStep = () => {
    if (!path.length) {
      return
    }
    setIsPlaying(false)
    setStepIndex((prev) => Math.min(prev + 1, path.length - 1))
  }

  const inBounds = (row, col) =>
    row >= 0 && col >= 0 && row < baseGrid.length && col < baseGrid[0].length

  const clampGridSize = (value) => {
    if (!Number.isFinite(value)) {
      return null
    }
    const rounded = Math.round(value)
    return Math.max(3, Math.min(50, rounded))
  }

  const applyResizeGrid = (rows, cols) => {
    const nextRows = clampGridSize(rows)
    const nextCols = clampGridSize(cols)
    if (!nextRows || !nextCols) {
      return null
    }

    const nextGrid = Array.from({ length: nextRows }, (_, rowIndex) =>
      Array.from({ length: nextCols }, (_, colIndex) => {
        if (baseGrid[rowIndex] && baseGrid[rowIndex][colIndex] !== undefined) {
          return baseGrid[rowIndex][colIndex]
        }
        return 0
      })
    )

    const nextTargets = targets.filter(([row, col]) => row < nextRows && col < nextCols)
    const nextStart = start && start[0] < nextRows && start[1] < nextCols ? start : null

    setBaseGrid(nextGrid)
    setTargets(nextTargets)
    setStart(nextStart)
    resetPath()
    localStorage.removeItem(cacheKey)

    return { rows: nextRows, cols: nextCols }
  }

  const clearObstacles = () => {
    setBaseGrid((prev) => prev.map((gridRow) => gridRow.map(() => 0)))
    resetPath()
    localStorage.removeItem(cacheKey)
  }

  const moveTarget = (fromRow, fromCol, toRow, toCol) => {
    if (!targets.some(([row, col]) => row === fromRow && col === fromCol)) {
      return { message: `No target found at ${fromRow},${fromCol}.` }
    }
    if (start && start[0] === toRow && start[1] === toCol) {
      return { message: 'Target cannot be placed on the start position.' }
    }
    if (baseGrid[toRow][toCol] === 1) {
      return { message: 'Target cannot be placed on an obstacle.' }
    }

    setTargets((prev) => {
      const filtered = prev.filter(([row, col]) => !(row === fromRow && col === fromCol))
      if (filtered.some(([row, col]) => row === toRow && col === toCol)) {
        return filtered
      }
      return [...filtered, [toRow, toCol]]
    })

    return { message: `Command detected: Move target to ${toRow},${toCol}`, speak: 'Target moved.' }
  }

  const handleVoiceCommand = (command, transcript) => {
    if (command.action === 'unknown') {
      return { message: 'Command not recognized. Please try again.' }
    }

    const withCoords = (handler, okMessage, failMessage) => {
      if (!command.hasCoords) {
        return { message: 'Please include row and column coordinates.' }
      }
      if (!inBounds(command.row, command.col)) {
        return { message: 'Coordinates are outside the grid.' }
      }
      handler(command.row, command.col)
      return { message: okMessage, speak: okMessage }
    }

    switch (command.action) {
      case 'add_obstacle':
        return withCoords(
          (row, col) => setObstacleAt(row, col, true),
          `Command detected: Add obstacle at ${command.row},${command.col}`,
          'Unable to add obstacle.'
        )
      case 'remove_obstacle':
        return withCoords(
          (row, col) => setObstacleAt(row, col, false),
          `Command detected: Remove obstacle at ${command.row},${command.col}`,
          'Unable to remove obstacle.'
        )
      case 'add_target':
        return withCoords(
          (row, col) => setTargetAt(row, col, true),
          `Command detected: Add target at ${command.row},${command.col}`,
          'Unable to add target.'
        )
      case 'remove_target':
        return withCoords(
          (row, col) => setTargetAt(row, col, false),
          `Command detected: Remove target at ${command.row},${command.col}`,
          'Unable to remove target.'
        )
      case 'move_start':
        return withCoords(
          (row, col) => setStartAt(row, col),
          `Command detected: Move start to ${command.row},${command.col}`,
          'Unable to move start.'
        )
      case 'move_target': {
        if (!command.hasMoveCoords) {
          return { message: 'Please include both source and destination coordinates.' }
        }
        if (!inBounds(command.row, command.col) || !inBounds(command.row2, command.col2)) {
          return { message: 'Coordinates are outside the grid.' }
        }
        return moveTarget(command.row, command.col, command.row2, command.col2)
      }
      case 'clear_obstacles':
        clearObstacles()
        return { message: 'Command detected: Clear all obstacles', speak: 'Clearing obstacles.' }
      case 'clear_targets':
        clearTargets()
        resetPath()
        return { message: 'Command detected: Remove all targets', speak: 'Clearing targets.' }
      case 'calculate_route':
        handleCalculateRoute()
        return { message: 'Command detected: Calculate route', speak: 'Calculating route.' }
      case 'start_animation':
        handleStartAnimation()
        return { message: 'Command detected: Start animation', speak: 'Starting animation.' }
      case 'pause_animation':
        handlePauseAnimation()
        return { message: 'Command detected: Pause animation', speak: 'Pausing animation.' }
      case 'resume_animation':
        handleResumeAnimation()
        return { message: 'Command detected: Resume animation', speak: 'Resuming animation.' }
      case 'reset_route':
        handleResetAnimation()
        return { message: 'Command detected: Reset route', speak: 'Resetting route.' }
      case 'clear_path':
        resetPath()
        return { message: 'Command detected: Clear route', speak: 'Clearing route.' }
      case 'reset_grid':
        resetGrid()
        return { message: 'Command detected: Reset grid', speak: 'Grid reset.' }
      case 'set_grid': {
        if (!command.hasSize) {
          return { message: 'Please include rows and columns.' }
        }
        const resized = applyResizeGrid(command.rows, command.cols)
        if (!resized) {
          return { message: 'Unable to resize the grid.' }
        }
        return {
          message: `Command detected: Set grid to ${resized.rows} by ${resized.cols}`,
          speak: `Grid set to ${resized.rows} by ${resized.cols}.`
        }
      }
      case 'increase_grid': {
        if (!command.hasSingleSize) {
          return { message: 'Please include a grid size.' }
        }
        const resized = applyResizeGrid(command.size, command.size)
        if (!resized) {
          return { message: 'Unable to resize the grid.' }
        }
        return {
          message: `Command detected: Increase grid size to ${resized.rows}`,
          speak: `Grid size set to ${resized.rows}.`
        }
      }
      case 'next_step':
        handleNextStep()
        return { message: 'Command detected: Next step', speak: 'Next step.' }
      default:
        return { message: `Command detected: ${transcript}` }
    }
  }

  const clearTargets = () => {
    setTargets([])
  }

  const resetGrid = () => {
    const clearedGrid = emptyGrid(baseGrid.length, baseGrid[0].length)
    setBaseGrid(clearedGrid)
    setTargets([])
    setStart(null)
    setJsonText(buildJsonFromState(clearedGrid, null, []))
    resetPath()
    localStorage.removeItem(cacheKey)
  }

  const resizeGrid = (rows, cols) => {
    applyResizeGrid(rows, cols)
  }

  const handleExportJson = () => {
    const json = buildJsonFromState(baseGrid, start, targets)
    setJsonText(json)
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).catch(() => {})
    }
  }

  return (
    <>
      <div className="min-h-screen bg-mist text-ink dark:bg-slate-950 dark:text-slate-100">
        <header className="mx-auto max-w-6xl px-6 pb-6 pt-10">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-white via-mist to-clay/60 p-8 shadow-glow dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-800/40">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink/60 dark:text-slate-300">
                RouteMaster Order Picker
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white dark:border-slate-400 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
                  type="button"
                  onClick={() => setIsDark((prev) => !prev)}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={isDark ? 'Light Mode' : 'Dark Mode'}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      fill="currentColor"
                      d="M12 3.5a1 1 0 0 1 1 1v1.25a1 1 0 1 1-2 0V4.5a1 1 0 0 1 1-1Zm0 13.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 1.5a1 1 0 0 1 1 1v1.25a1 1 0 1 1-2 0V19a1 1 0 0 1 1-1Zm8.5-7.5a1 1 0 0 1-1 1h-1.25a1 1 0 1 1 0-2H19.5a1 1 0 0 1 1 1Zm-13.5 0a1 1 0 0 1-1 1H4.75a1 1 0 1 1 0-2H6a1 1 0 0 1 1 1Zm9.72-5.47a1 1 0 0 1 1.41 0l.88.88a1 1 0 1 1-1.41 1.41l-.88-.88a1 1 0 0 1 0-1.41Zm-9.84 9.84a1 1 0 0 1 1.41 0l.88.88a1 1 0 1 1-1.41 1.41l-.88-.88a1 1 0 0 1 0-1.41Zm10.72 1.41a1 1 0 0 1 0 1.41l-.88.88a1 1 0 1 1-1.41-1.41l.88-.88a1 1 0 0 1 1.41 0ZM7.12 6.76a1 1 0 0 1 0 1.41l-.88.88a1 1 0 1 1-1.41-1.41l.88-.88a1 1 0 0 1 1.41 0Z"
                    />
                  </svg>
                </button>
                <VoiceControl
                  enabled={voiceEnabled}
                  onEnabledChange={setVoiceEnabled}
                  onCommand={handleVoiceCommand}
                  voiceReply={voiceReplyEnabled}
                  compact
                  onFeedback={setVoiceFeedback}
                />
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white dark:border-slate-400 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
                  type="button"
                  onClick={() => setWorkerMode((prev) => !prev)}
                  aria-label={workerMode ? 'Exit worker mode' : 'Enable worker mode'}
                  title={workerMode ? 'Exit Worker Mode' : 'Worker Mode'}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      fill="currentColor"
                      d="M12 12.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.04 0-7.5 1.53-7.5 4.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1c0-2.97-4.46-4.5-7.5-4.5Z"
                    />
                  </svg>
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white dark:border-slate-400 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
                  type="button"
                  onClick={() => setLayoutMode((prev) => (prev === 'paint' ? 'drag' : 'paint'))}
                  disabled={workerMode}
                  aria-label={layoutMode === 'paint' ? 'Open layout builder' : 'Switch to paint mode'}
                  title={layoutMode === 'paint' ? 'Layout Builder' : 'Paint Mode'}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      fill="currentColor"
                      d="M3 4a2 2 0 0 1 2-2h4a1 1 0 0 1 0 2H5v4a1 1 0 1 1-2 0V4Zm13 0a1 1 0 1 1 2 0v4a2 2 0 0 1-2 2h-4a1 1 0 1 1 0-2h4V4ZM3 16a1 1 0 0 1 2 0v4h4a1 1 0 1 1 0 2H5a2 2 0 0 1-2-2v-4Zm15 0a1 1 0 0 1 2 0v4a2 2 0 0 1-2 2h-4a1 1 0 1 1 0-2h4v-4Z"
                    />
                  </svg>
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white dark:border-slate-400 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
                  type="button"
                  onClick={() => setViewMode((prev) => (prev === '2d' ? '3d' : '2d'))}
                  disabled={workerMode}
                  aria-label={viewMode === '2d' ? 'Switch to 3D view' : 'Switch to 2D view'}
                  title={viewMode === '2d' ? '3D View' : '2D View'}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      fill="currentColor"
                      d="M4 5a2 2 0 0 1 2-2h5a1 1 0 1 1 0 2H6v5a1 1 0 1 1-2 0V5Zm9-2a1 1 0 0 1 1-1h4a2 2 0 0 1 2 2v4a1 1 0 1 1-2 0V4h-4a1 1 0 0 1-1-1ZM4 14a1 1 0 0 1 2 0v5h5a1 1 0 1 1 0 2H6a2 2 0 0 1-2-2v-5Zm14 0a1 1 0 0 1 2 0v5a2 2 0 0 1-2 2h-4a1 1 0 1 1 0-2h4v-5Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink dark:text-slate-100 md:text-5xl">
              RouteMaster Command Center
            </h1>
            <p className="mt-3 max-w-2xl text-base text-ink/70 dark:text-slate-300">
              Design warehouse layouts, dispatch pick routes, and animate every move from a single live
              operations dashboard.
            </p>
            {voiceFeedback ? (
              <p className="mt-3 text-sm text-ink/60 dark:text-slate-300">{voiceFeedback}</p>
            ) : null}
            {apiError ? <p className="mt-4 text-sm text-ember">{apiError}</p> : null}
          </div>
        </header>

        {workerMode ? (
          <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pb-10">
            <MobileRouteView
              baseGrid={baseGrid}
              targets={targets}
              path={path}
              stepIndex={stepIndex}
              zoom={zoom}
              onZoomChange={setZoom}
            />
            <WorkerNavigationPanel
              path={path}
              stepIndex={stepIndex}
              targets={targets}
              isPlaying={isPlaying}
              onStart={handleStartAnimation}
              onPause={handlePauseAnimation}
              onNext={handleNextStep}
            />
          </main>
        ) : (
          <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-10 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-6">
          {viewMode === '2d' ? (
            layoutMode === 'paint' ? (
              <GridEditor
                baseGrid={baseGrid}
                start={start}
                targets={targets}
                path={path}
                stepIndex={stepIndex}
                mode={mode}
                onModeChange={setMode}
                onSetStart={setStartAt}
                onSetTarget={setTargetAt}
                onSetObstacle={setObstacleAt}
                onClearCell={clearCell}
                onResize={resizeGrid}
                onExportJson={handleExportJson}
              />
            ) : (
              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex flex-col gap-6">
                  <DragToolbox />
                  <WarehouseCanvas
                    baseGrid={baseGrid}
                    start={start}
                    targets={targets}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    onClearCell={clearCell}
                  />
                </div>
                <DragOverlay>
                  {activeDragItem?.type === 'shelf' ? (
                    <div className="h-8 w-8 rounded-lg bg-black" />
                  ) : activeDragItem?.type === 'target' ? (
                    <div className="h-8 w-8 rounded-lg bg-sun" />
                  ) : activeDragItem?.type === 'start' ? (
                    <div className="h-8 w-8 rounded-full bg-moss" />
                  ) : activeDragItem?.type === 'empty' ? (
                    <div className="h-8 w-8 rounded-lg border border-clay/60 bg-white" />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )
          ) : (
            <Warehouse3DView
              baseGrid={baseGrid}
              targets={targets}
              path={path}
              speedMs={animationSpeed}
              isPlaying={isPlaying}
              animationToken={animationToken}
            />
          )}

        </div>

        <div className="flex flex-col gap-6">
          <PathAnimator
            path={path}
            isPlaying={isPlaying}
            speed={animationSpeed}
            stepIndex={stepIndex}
            onStepChange={setStepIndex}
            onStart={handleStartAnimation}
            onPause={handlePauseAnimation}
            onResume={handleResumeAnimation}
            onReset={handleResetAnimation}
          />

          <section className="rounded-3xl border border-clay/60 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-ink dark:text-slate-100">Layout JSON</h2>
              <button
                className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                type="button"
                onClick={() => setIsJsonOpen(true)}
              >
                Open JSON Editor
              </button>
            </div>
            <p className="mt-3 text-sm text-ink/70 dark:text-slate-300">
              View, import, and export the grid JSON in a focused popup editor.
            </p>
          </section>


          <section className="rounded-3xl border border-clay/60 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
            <h2 className="text-xl font-semibold text-ink dark:text-slate-100">Route Metrics</h2>
            <div className="mt-4 grid gap-3 text-sm text-ink/80 dark:text-slate-200">
              <div className="flex items-center justify-between rounded-2xl bg-mist/80 p-3 dark:bg-slate-800/70">
                <span>Total Steps</span>
                <span className="text-lg font-semibold text-ink dark:text-slate-100">
                  {metrics.total_steps}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-mist/80 p-3 dark:bg-slate-800/70">
                <span>Targets Collected</span>
                <span className="text-lg font-semibold text-ink dark:text-slate-100">
                  {metrics.targets_collected}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-mist/80 p-3 dark:bg-slate-800/70">
                <span>Grid Size</span>
                <span className="text-lg font-semibold text-ink dark:text-slate-100">
                  {baseGrid.length} x {baseGrid[0].length}
                </span>
              </div>
              <div className="rounded-2xl bg-mist/80 p-3 dark:bg-slate-800/70">
                <p className="text-xs uppercase tracking-[0.25em] text-ink/50 dark:text-slate-300">
                  Route Travelled
                </p>
                {routeTravelled ? (
                  <p className="mt-2 max-h-24 overflow-auto break-words font-mono text-xs text-ink dark:text-slate-200">
                    {routeTravelled}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-ink/60 dark:text-slate-300">
                    Calculate a route to see the step-by-step path.
                  </p>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-ink/50 dark:text-slate-300">
              Preview Targets
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {targets.length ? (
                targets.map(([row, col]) => (
                  <span
                    key={toKey(row, col)}
                    className="rounded-full border border-ink px-3 py-1 text-xs font-semibold text-ink dark:border-slate-500 dark:text-slate-200"
                  >
                    {row},{col}
                  </span>
                ))
              ) : (
                <span className="text-sm text-ink/60 dark:text-slate-300">No targets selected.</span>
              )}
            </div>
          </section>
            </div>
          </main>
        )}
      </div>
      <Modal title="JSON Editor" isOpen={isJsonOpen} onClose={() => setIsJsonOpen(false)}>
        <JsonInput
          value={jsonText}
          onChange={setJsonText}
          onApply={handleApplyJson}
          onUpload={handleUploadJson}
          onDownload={handleDownloadJson}
          error={error}
        />
      </Modal>
      {!workerMode ? (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2 rounded-3xl border border-clay/60 bg-white/90 p-3 shadow-glow backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
          <button
            className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow"
            type="button"
            onClick={handleCalculateRoute}
          >
            Calculate Route
          </button>
          <button
            className="rounded-full border border-ink px-5 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
            type="button"
            onClick={resetPath}
          >
            Clear Path
          </button>
          <button
            className="rounded-full border border-ink px-5 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
            type="button"
            onClick={clearTargets}
          >
            Clear Targets
          </button>
          <button
            className="rounded-full border border-ink px-5 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-slate-900"
            type="button"
            onClick={resetGrid}
          >
            Reset Grid
          </button>
        </div>
      ) : null}
    </>
  )
}
