import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware

from routes.dummy import router as dummy_router
from routes.tree_new import router as tree_router
from db import init_db

default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
    "http://frontend:3000",
]

origins = os.getenv("CORS_ORIGINS")
if origins:
    allow_origins = [o.strip() for o in origins.split(",") if o.strip()]
else:
    allow_origins = default_origins

cors_middleware = Middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup."""
    await init_db()
    yield


app = FastAPI(
    title="FWE'25 Backend API",
    version="1.0.0",
    middleware=[cors_middleware],
    lifespan=lifespan,
)

app.include_router(dummy_router)
app.include_router(tree_router)


@app.get("/health", tags=["Monitoring"])
async def health():
    return {"status": "ok"}
