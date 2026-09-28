# Glass Tree

Glass Tree is a team project from ETH Zurich's Web Engineering course. It is an interactive editor for exploring and modifying a decision tree trained on heart disease data. Users can inspect nodes, change features and thresholds, edit branches, switch graph layouts and color views, and evaluate the tree.

This is a research and teaching prototype, not a clinical decision tool.

## Stack

- **Frontend:** Next.js, React, TypeScript, React Flow, Dagre, Recharts
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Tree generation:** Python, scikit-learn, FastAPI microservice
- **Local orchestration:** Docker Compose

## Architecture

The tree-generation microservice creates the initial tree. The backend serves that tree, stores complete tree snapshots in PostgreSQL for undo and redo, and provides feature distributions and evaluation endpoints. The frontend converts the nested tree returned by the API into React Flow nodes and edges. Editing actions update the graph and send the nested tree back to the backend.

The main frontend files are `frontend/nextjs/src/app/components/TreeCanvas.tsx` (editor interactions), `frontend/nextjs/src/hooks/useTreeData.ts` (API and graph conversion), `frontend/nextjs/src/app/components/NodeMenu.tsx` (node controls), and `frontend/nextjs/src/utils/layoutNodes.ts` (automatic layout).

## Run locally

Install Docker and Docker Compose, then run from the repository root:

```bash
docker compose up --build
```

Open `http://localhost:3000`. The backend is available at `http://localhost:8080`, and the tree-generation microservice at `http://localhost:8081`. The included dataset is used by both Python services.

## Team and attribution

Created by **Teodor Moscu, Firas Dridi, Metehan Kilic, and Emre Özel** for ETH Zurich's Web Engineering course. Firas worked primarily on the frontend, including the node toolbox, feature selection, child-node controls, graph controls, and initial landing page work. This repository is a cleaned presentation copy of the final team project; the original course GitLab history is not included.

The heart disease dataset is included because the local services need it. Its original licensing and provenance should be verified before reuse outside this course project.
