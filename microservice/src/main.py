import os

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_versioning import version, VersionedFastAPI
from starlette.middleware import Middleware
from fastapi.staticfiles import StaticFiles

from routes.dummy import router as dummy_router
from routes.tree import router as tree_router

origins = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

cors_middleware = Middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The call to VersionedFastAPI() must receive the same parameters as FastAPI().
# See: https://github.com/DeanWay/fastapi-versioning#extra-fastapi-constructor-arguments
fastapi_args = {
    "version": "1.0.0",
    "middleware": [cors_middleware],
}

app = FastAPI(title="FWE'25 Microservice API", 
            docs_url="/docs",
            redoc_url=None,
            openapi_url="/openapi.json",
            description= """
![Teaser image](/static/static_pic.png)

This microservice provides a **functionally independent decision tree generator**.

Our project focuses on creating a decision tree trained on tabular data, specifically the heart disease dataset. The microservice exposes endpoints to retrieve the trained tree and to retrain it with custom parameters.
The project enables the users to generate, modify and evaluate decision trees.

### Features
- Train a decision tree on tabular data
- Retrain with custom parameters
- Return a frontend-compatible tree structure

All endpoints are versioned under `/v1`.
""",
              **fastapi_args)


app.include_router(dummy_router)

#app.include_router(tree_router)

v1 = APIRouter(prefix="/v1")
v1.include_router(tree_router)   # tree_router already has prefix="/tree"
app.include_router(v1)

#for the automatic doc generation using manual versioning is easy fix
#app.include_router(tree_router)
#app = VersionedFastAPI(
 #   app,
  #  **fastapi_args,
   # version_format="{major}",
    #prefix_format="/v{major}",
    #enable_latest=True,
#)


# Mount static files for documentation images (after VersionedFastAPI)
app.mount("/static", StaticFiles(directory="static"), name="static")


##################################################################
# THE FOLLOWING ENDPOINTS SHOULD BE UNVERSIONED, AND, THEREFORE, #
# HAVE TO BE DECLARED AFTER THE CALL TO VersionedFastAPI()       #
##################################################################


@app.get("/health", tags=["Monitoring"])
#@version(0)
async def health():
    return {"status": "ok"}
