# RouteMaster Order Picker

RouteMaster Order Picker is a warehouse route-planning app with a React + Vite frontend and a FastAPI backend exposed as a Vercel Python function.

## What it does

- Edit a warehouse grid by painting obstacles, setting a start point, and adding targets.
- Import or export the layout as JSON.
- Calculate a route that avoids obstacles and visits each target.
- View the route in 2D, 3D, or worker-focused layouts.

## Project Layout

- `src/` contains the React UI.
- `src/components/` contains the editor, animator, and view components.
- `api/index.py` contains the FastAPI route solver.
- `vercel.json` wires the frontend and Python function together for deployment.

## Run Locally

1. Install dependencies with `npm install`.
2. Start the frontend with `npm run dev`.
3. Build for production with `npm run build`.

The API is served from `/api` and `/api/route` in development and on Vercel.

## API

### POST /api/route

Request body:

- `grid`: 2D array using `0` for walkable cells, `1` for obstacles, and `2` for targets.
- `start`: `[row, col]` start coordinate.
- `targets`: optional list of target coordinates.

Response:

```json
{
  "total_steps": 12,
  "path": [[0, 0], [0, 1], [1, 1]],
  "targets_collected": 2
}
```

## Notes

- The solver uses BFS for shortest segments and a nearest-target greedy order.
- Generated folders like `dist/`, `node_modules/`, and Python `__pycache__/` should stay untracked.
