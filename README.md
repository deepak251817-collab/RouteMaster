# RouteMaster 🚀

**Intelligent Warehouse Route Optimization & Order Picking System**

RouteMaster is a web-based warehouse navigation system that calculates and visualizes efficient routes for order picking. It supports interactive warehouse layouts, obstacle handling, BFS pathfinding, voice controls, route animation, and 2D/3D visualization.

## ✨ Features

* 🧭 BFS-based route planning
* 🗺️ Interactive warehouse grid
* 🚧 Obstacles and configurable layouts
* 🎙️ Voice-based controls
* 🎬 Animated route visualization
* 👷 Worker navigation mode
* 📦 JSON import/export
* 🏭 2D and 3D warehouse visualization
* 📱 Responsive interface

## 🛠️ Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Three.js
**Backend:** Python, FastAPI
**Algorithm:** Breadth-First Search (BFS)

## 🚀 Run Locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
npm install
npm run dev
```

Open the development URL shown by Vite in your browser.

## 📁 Project Structure

```text
RouteMaster/
├── backend/       # FastAPI backend
├── src/           # React frontend
├── public/        # Static assets
├── package.json
└── README.md
```

## 📌 Future Improvements

* A* pathfinding
* Multi-order optimization
* Multiple worker/robot routing
* Route analytics
* Dynamic obstacles

## 👨‍💻 Project

Built as a project to explore **data structures, pathfinding algorithms, warehouse optimization, and modern web development**.
