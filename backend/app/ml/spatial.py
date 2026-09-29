import math
import numpy as np
from typing import List, Dict, Any, Tuple


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance in km between two lat/lon coordinates."""
    r = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def find_nearest_stations(
    target_station_id: str,
    all_stations: List[Dict[str, Any]],
    k: int = 4
) -> List[Dict[str, Any]]:
    """Find the k nearest neighboring stations."""
    target = next((s for s in all_stations if s["station_id"] == target_station_id), None)
    if not target:
        return []

    distances = []
    for s in all_stations:
        if s["station_id"] == target_station_id:
            continue
        dist = haversine_distance(
            target["latitude"], target["longitude"],
            s["latitude"], s["longitude"]
        )
        distances.append({
            "station_id": s["station_id"],
            "name": s.get("name", s["station_id"]),
            "distance_km": round(dist, 2),
            "temperature": s.get("temperature"),
            "pressure": s.get("pressure"),
            "humidity": s.get("humidity"),
            "status": s.get("status", "ONLINE")
        })

    distances.sort(key=lambda x: x["distance_km"])
    return distances[:k]


def calculate_spatial_score(
    target_station: Dict[str, Any],
    all_stations: List[Dict[str, Any]],
    param: str = "temperature",
    k: int = 4
) -> Tuple[float, float, List[Dict[str, Any]], Dict[str, Any]]:
    """
    Evaluates spatial deviation and spatial consistency.
    Returns:
    - spatial_deviation_score: [0..1] how much this station differs from neighbors
    - spatial_consistency: [0..1] degree to which neighbors also shifted similarly
    - neighbors: list of neighbor details
    - metrics: dictionary with median, spread, etc.
    """
    neighbors = find_nearest_stations(target_station["station_id"], all_stations, k=k)
    target_val = target_station.get(param)

    if target_val is None or not neighbors:
        return 0.0, 0.0, [], {"error": "Insufficient spatial data"}

    valid_neighbors = [n for n in neighbors if n.get(param) is not None and n.get("status") != "OFFLINE"]
    if not valid_neighbors:
        return 0.0, 0.0, neighbors, {"error": "No online neighbors"}

    neighbor_vals = [n[param] for n in valid_neighbors]
    median_neighbor = float(np.median(neighbor_vals))
    mean_neighbor = float(np.mean(neighbor_vals))
    std_neighbor = float(np.std(neighbor_vals))
    if std_neighbor < 0.3:
        std_neighbor = 0.5  # safe lower bound

    # Difference between target and neighbor consensus
    diff = abs(target_val - median_neighbor)

    # Normalize deviation
    # In temperature, diff > 4°C is noticeable, diff > 15°C is extreme
    if param == "temperature":
        scale = 12.0
    elif param == "pressure":
        scale = 8.0
    else:  # humidity
        scale = 25.0

    spatial_deviation_score = float(np.clip(diff / scale, 0.0, 1.0))

    # Evaluate spatial consistency:
    # If the network as a whole moved away from its baseline,
    # or if neighbors also show an elevated or suppressed reading similar to the target:
    # We check the variance/spread among neighbors and target
    all_cluster_vals = [target_val] + neighbor_vals
    cluster_std = float(np.std(all_cluster_vals))

    # Consistency is high if neighbor values are also elevated/shifted together
    # If target is 55°C, but neighbors are [31, 32, 33, 31],
    # diff is 23°C -> isolated outlier -> consistency = 0.0, deviation = 1.0
    # If target is 37°C, and neighbors are [36, 37, 36, 37],
    # diff between target and neighbor median is ~0.5°C, but if both moved up by +5°C from baseline,
    # then they are consistent.
    # Also if neighbor median has shifted by more than 3°C from normal (~31°C):
    baseline_temp = 31.5
    neighbor_shift = abs(median_neighbor - baseline_temp)
    target_shift = abs(target_val - baseline_temp)

    # If both target and neighbors have large shift from normal, and low difference between each other:
    if target_shift > 3.0 and neighbor_shift > 2.5 and diff < 3.0:
        spatial_consistency = float(np.clip(neighbor_shift / 6.0, 0.6, 1.0))
    elif diff < 2.0:
        spatial_consistency = 0.85
    else:
        # Isolated reading
        spatial_consistency = max(0.0, 1.0 - (diff / 8.0))

    metrics = {
        "target_value": target_val,
        "neighbor_median": round(median_neighbor, 2),
        "neighbor_mean": round(mean_neighbor, 2),
        "neighbor_std": round(std_neighbor, 2),
        "absolute_spatial_diff": round(diff, 2),
        "neighbor_count": len(valid_neighbors),
        "spatial_consistency": round(spatial_consistency, 2)
    }

    return spatial_deviation_score, spatial_consistency, neighbors, metrics
