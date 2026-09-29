import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.simulation.simulator import simulator
from app.services.data_service import data_service


def run_tests():
    print("=" * 60)
    print("RUNNING SKYGUARD AI BACKEND VALIDATION SUITE")
    print("=" * 60)

    # TEST 1: Normal Data
    print("\n[TEST 1] Testing Normal Data Baseline...")
    res1 = simulator.start_simulation("AWS-003", scenario="normal")
    target1 = res1["target_result"]
    assert target1["classification"] == "NORMAL", f"Expected NORMAL, got {target1['classification']}"
    assert target1["is_anomaly"] is False
    print(f" PASS: AWS-003 is {target1['classification']} (Confidence: {target1['confidence']}%)")

    # TEST 2: Sensor Spike (55°C on AWS-003, nearby ~31°C)
    print("\n[TEST 2] Testing Sensor Spike (AWS-003 = 55°C, nearby = 31-33°C)...")
    res2 = simulator.start_simulation("AWS-003", scenario="sensor_spike", intensity="medium")
    target2 = res2["target_result"]
    assert target2["classification"] == "SENSOR FAULT", f"Expected SENSOR FAULT, got {target2['classification']}"
    assert target2["fault_type"] == "SENSOR SPIKE", f"Expected SENSOR SPIKE, got {target2['fault_type']}"
    assert target2["confidence"] >= 85.0
    print(f" PASS: AWS-003 is {target2['classification']} ({target2['fault_type']})")
    print(f"       Confidence: {target2['confidence']}%, Severity: {target2['severity']}")
    print(f"       Explanation: {target2['explanation'][:100]}...")

    # TEST 3: Weather Event (Multiple nearby stations increase together)
    print("\n[TEST 3] Testing Weather Event (Correlated multi-station increase)...")
    res3 = simulator.start_simulation("AWS-003", scenario="weather_event", intensity="medium")
    target3 = res3["target_result"]
    assert target3["classification"] == "WEATHER EVENT", f"Expected WEATHER EVENT, got {target3['classification']}"
    assert target3["confidence"] >= 85.0
    print(f" PASS: AWS-003 is {target3['classification']} ({target3['fault_type']})")
    print(f"       Confidence: {target3['confidence']}%, Severity: {target3['severity']}")
    print(f"       Explanation: {target3['explanation'][:100]}...")

    # TEST 4: Gradual Sensor Drift
    print("\n[TEST 4] Testing Sensor Drift (Monotonic departure from baseline)...")
    res4 = simulator.start_simulation("AWS-003", scenario="sensor_drift", intensity="medium")
    target4 = res4["target_result"]
    assert target4["classification"] == "SENSOR FAULT", f"Expected SENSOR FAULT, got {target4['classification']}"
    assert target4["fault_type"] == "SENSOR DRIFT", f"Expected SENSOR DRIFT, got {target4['fault_type']}"
    # Check health score drops
    st4 = data_service.get_station("AWS-003")
    assert st4["health_score"] < 80.0, f"Expected health < 80, got {st4['health_score']}"
    print(f" PASS: AWS-003 is {target4['classification']} ({target4['fault_type']})")
    print(f"       Health Score: {st4['health_score']}/100, Maintenance Risk: {st4['maintenance_risk']}")

    # TEST 5: Frozen Sensor (Repeated identical readings)
    print("\n[TEST 5] Testing Frozen Sensor (Constant identical telemetry)...")
    res5 = simulator.start_simulation("AWS-003", scenario="frozen_sensor")
    target5 = res5["target_result"]
    assert target5["classification"] == "SENSOR FAULT", f"Expected SENSOR FAULT, got {target5['classification']}"
    assert target5["fault_type"] == "FROZEN SENSOR", f"Expected FROZEN SENSOR, got {target5['fault_type']}"
    st5 = data_service.get_station("AWS-003")
    assert st5["maintenance_risk"] == "HIGH", f"Expected HIGH risk, got {st5['maintenance_risk']}"
    print(f" PASS: AWS-003 is {target5['classification']} ({target5['fault_type']})")
    print(f"       Health Score: {st5['health_score']}/100, Maintenance Risk: {st5['maintenance_risk']}")

    # TEST 6: Missing Data / Offline
    print("\n[TEST 6] Testing Missing Data / Offline station...")
    res6 = simulator.start_simulation("AWS-003", scenario="missing_data")
    target6 = res6["target_result"]
    assert target6["classification"] == "SENSOR FAULT", f"Expected SENSOR FAULT, got {target6['classification']}"
    assert target6["fault_type"] == "MISSING DATA", f"Expected MISSING DATA, got {target6['fault_type']}"
    st6 = data_service.get_station("AWS-003")
    assert st6["status"] == "OFFLINE"
    print(f" PASS: AWS-003 is {st6['status']} -> {target6['classification']} ({target6['fault_type']})")

    # TEST 7: Reset Simulation
    print("\n[TEST 7] Testing Simulation Reset...")
    reset_res = simulator.reset_simulation()
    target_reset = reset_res["all_results"]["AWS-003"]
    assert target_reset["classification"] == "NORMAL"
    print(" PASS: Reset successfully restored all stations to NORMAL baseline.")

    print("\n" + "=" * 60)
    print("ALL 6 MANDATORY TEST CASES PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
