"""Optional FastAPI sidecar exposing the spin-glass kernel.

Run:
    cd backend/api
    uvicorn main:app --reload --port 8000

The frontend works without this service. Start it only when you want live
computation against uploaded data.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router

app = FastAPI(
    title="Spin-Glass Marketing Exploration API",
    version="0.1.0",
    description="Thin HTTP layer over backend/brand_ising_spin_glass.py.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3760", "http://127.0.0.1:3760"],
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "spinglass-api"}


app.include_router(router)
