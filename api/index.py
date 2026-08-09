from collections import deque
from typing import List, Tuple

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


def in_bounds(point: Tuple[int, int], rows: int, cols: int) -> bool:
    return 0 <= point[0] < rows and 0 <= point[1] < cols


def neighbors(point: Tuple[int, int]) -> List[Tuple[int, int]]:
    row, col = point
    return [(row - 1, col), (row + 1, col), (row, col - 1), (row, col + 1)]


def bfs_path(grid: List[List[int]], start: Tuple[int, int], goal: Tuple[int, int]) -> List[Tuple[int, int]]:
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    if not in_bounds(start, rows, cols) or not in_bounds(goal, rows, cols):
        return []
    if start == goal:
        return [start]
    queue = deque([start])
    came_from = {start: None}
    while queue:
        current = queue.popleft()
        for nxt in neighbors(current):
            if not in_bounds(nxt, rows, cols):
                continue
            if grid[nxt[0]][nxt[1]] == 1:
                continue
            if nxt in came_from:
                continue
            came_from[nxt] = current
            if nxt == goal:
                queue.clear()
                break
            queue.append(nxt)
    if goal not in came_from:
        return []
    path = [goal]
    current = goal
    while came_from[current] is not None:
        current = came_from[current]
        path.append(current)
    path.reverse()
    return path


def parse_targets(grid: List[List[int]]) -> List[Tuple[int, int]]:
    targets = []
    for r, row in enumerate(grid):
        for c, value in enumerate(row):
            if value == 2:
                targets.append((r, c))
    return targets


class RouteRequest(BaseModel):
    grid: List[List[int]]
    start: List[int]
    targets: List[List[int]] = []


class RouteResponse(BaseModel):
    total_steps: int
    path: List[List[int]]
    targets_collected: int


app = FastAPI(title="RouteMaster Order Picker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
@app.get("/api")
@app.get("/api/")
def health_check() -> dict:
    return {"status": "ok"}


@app.post("/", response_model=RouteResponse)
@app.post("/api", response_model=RouteResponse)
@app.post("/api/", response_model=RouteResponse)
def build_route(payload: RouteRequest) -> RouteResponse:
    grid = payload.grid
    if not grid or not all(isinstance(row, list) and row for row in grid):
        raise HTTPException(status_code=400, detail="Grid must be a non-empty 2D array")
    rows = len(grid)
    cols = len(grid[0])
    if any(len(row) != cols for row in grid):
        raise HTTPException(status_code=400, detail="Grid rows must be the same length")

    start = tuple(payload.start)
    targets = [tuple(t) for t in payload.targets] if payload.targets else parse_targets(grid)

    if not in_bounds(start, rows, cols):
        raise HTTPException(status_code=400, detail="Start is outside the grid")
    if grid[start[0]][start[1]] == 1:
        raise HTTPException(status_code=400, detail="Start cannot be on an obstacle")

    for target in targets:
        if not in_bounds(target, rows, cols):
            raise HTTPException(status_code=400, detail="Target is outside the grid")
        if grid[target[0]][target[1]] == 1:
            raise HTTPException(status_code=400, detail="Target cannot be on an obstacle")

    remaining = targets[:]
    current = start
    full_path: List[Tuple[int, int]] = [current]

    while remaining:
        best_target = None
        best_path: List[Tuple[int, int]] = []
        best_steps = None

        for target in remaining:
            candidate_path = bfs_path(grid, current, target)
            if not candidate_path:
                continue
            steps = len(candidate_path) - 1
            if best_steps is None or steps < best_steps:
                best_steps = steps
                best_target = target
                best_path = candidate_path

        if best_target is None:
            raise HTTPException(status_code=400, detail="At least one target is unreachable")

        full_path.extend(best_path[1:])
        current = best_target
        remaining.remove(best_target)

    total_steps = len(full_path) - 1 if full_path else 0
    return RouteResponse(
        total_steps=total_steps,
        path=[[point[0], point[1]] for point in full_path],
        targets_collected=len(targets),
    )


