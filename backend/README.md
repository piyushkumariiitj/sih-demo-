# SkyGuard AI – Backend Service

FastAPI-powered anomaly detection, spatial clustering, and explainable AI engine for Automatic Weather Stations (AWS).

## Features
- **Zero External Database:** Runs 100% in-memory with automatic self-healing JSON persistence.
- **Multi-Signal Anomaly Pipeline:**
  - Temporal Rate-of-Change & z-score
  - Spatial k-nearest neighbor consensus (Haversine distance)
  - Multivariate physical coupling (Temperature, Pressure, Humidity)
  - Sensor fault tests (Spike, Monotonic Drift, Frozen, Missing Data)
  - scikit-learn Isolation Forest
- **Differentiation:** Transparently classifies **WEATHER EVENT** vs **SENSOR FAULT**.
- **XAI Engine:** Outputs human-readable evidence points and confidence ratings.
- **Sensor Health Scoring:** 0–100 health index with predictive maintenance risk (LOW, MEDIUM, HIGH).

## Running
```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```

## Running Tests
```bash
python test_cases.py
```
