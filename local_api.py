"""Puente HTTP local de solo lectura para la interfaz consolidada."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from world import SQLiteWorldRepository

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("ENCYCLOPEDIA_DB", ROOT / "encyclopedia.db"))

app = FastAPI(title="Enciclopedia Planetaria Local", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000", "http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1_024)
repository = SQLiteWorldRepository(DB_PATH)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "local-readonly"}


@app.get("/api/world/overview")
def world_overview(response: Response) -> dict:
    response.headers["Cache-Control"] = "private, max-age=60"
    return repository.overview()


@app.get("/api/world/planets/{planet_id}/categories/{category_id}/records")
def category_records(
    planet_id: int,
    category_id: int,
    response: Response,
    query: str = Query(default="", max_length=120),
    page: int = Query(default=1, ge=1, le=10_000),
    page_size: int = Query(default=50, ge=1, le=100),
) -> dict:
    try:
        result = repository.browse_category(
            planet_id, category_id, query=query, page=page, page_size=page_size
        )
        response.headers["Cache-Control"] = "private, max-age=30"
        return result
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8765)
