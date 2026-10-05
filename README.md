# Interactive Decision Tree Visualization for Clinicians

Glass Tree is an interactive web app for exploring and editing a decision tree trained on heart disease data. Users can change split features and thresholds, edit branches, inspect feature distributions, and evaluate the resulting tree. It is a course prototype, not a clinical decision tool.

## Tech stack

- **Frontend:** Next.js, React, TypeScript, React Flow, Dagre
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Model service:** Python, scikit-learn, FastAPI

## Run locally

With Docker and Docker Compose installed, run:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The frontend uses the backend API to load and save trees; the backend uses a separate service to generate the initial tree. Both Python services use the included heart disease dataset.
