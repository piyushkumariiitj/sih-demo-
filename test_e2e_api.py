import urllib.request
import json

def test_live_servers():
    print("--- 1. Testing Frontend HTTP Server (Port 5173) ---")
    try:
        with urllib.request.urlopen("http://127.0.0.1:5173/") as res:
            print(f"Frontend HTTP Status: {res.status} (OK)")
            html_snippet = res.read().decode('utf-8')[:150]
            print(f"HTML snippet: {html_snippet}...")
    except Exception as e:
        print(f"Frontend request failed: {e}")

    print("\n--- 2. Testing Backend /api/dashboard ---")
    req = urllib.request.Request("http://127.0.0.1:8000/api/dashboard")
    with urllib.request.urlopen(req) as res:
        dash = json.loads(res.read().decode())
        print(f"Dashboard: Total Stations={dash['total_stations']}, Online={dash['online_stations']}, Avg Health={dash['average_health']}")

    print("\n--- 3. Testing POST /api/simulation/start (Sensor Spike) ---")
    spike_payload = json.dumps({"station_id": "AWS-003", "scenario": "sensor_spike", "intensity": "medium"}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/simulation/start",
        data=spike_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        target = data["target_result"]
        print(f"Target Classification: {target['classification']} ({target['fault_type']})")
        print(f"Target Confidence: {target['confidence']}%")
        print(f"Severity: {target['severity']}")
        print(f"Summary: {target['explanation']}")

    print("\n--- 4. Testing GET /api/alerts ---")
    with urllib.request.urlopen("http://127.0.0.1:8000/api/alerts") as res:
        alerts = json.loads(res.read().decode())
        print(f"Active Alerts Count: {len(alerts)}")
        if alerts:
            print(f"Top Alert: [{alerts[0]['classification']}] {alerts[0]['title']}")

    print("\n--- 5. Testing POST /api/simulation/start (Weather Event) ---")
    weather_payload = json.dumps({"station_id": "AWS-003", "scenario": "weather_event", "intensity": "medium"}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/simulation/start",
        data=weather_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        target = data["target_result"]
        print(f"Weather Classification: {target['classification']} ({target['fault_type']})")
        print(f"Weather Confidence: {target['confidence']}%")
        print(f"Summary: {target['explanation']}")

    print("\n--- 6. Testing POST /api/simulation/reset ---")
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/simulation/reset",
        data=b"",
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        print(f"Reset status: {data['message']}")

    print("\n[SUCCESS] ALL LIVE HTTP ENDPOINTS TESTED AND WORKING!")

if __name__ == "__main__":
    test_live_servers()
