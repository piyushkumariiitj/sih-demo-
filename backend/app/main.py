from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes import router
from app.simulation.simulator import simulator


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize baseline analysis on startup
    try:
        simulator.run_full_analysis()
        print("SkyGuard AI: Initialized baseline anomaly detection on 10 AWS stations.")
    except Exception as e:
        print(f"Warning during startup initialization: {e}")
    yield


app = FastAPI(
    title="SkyGuard AI Backend",
    description="AI/ML-Based Intelligent Anomaly Detection for Automatic Weather Stations (SIH26073)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "Welcome to SkyGuard AI Backend API",
        "docs": "/docs",
        "health": "/api/health",
        "dashboard": "/api/dashboard"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
