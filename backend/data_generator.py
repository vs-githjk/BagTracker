"""
Synthetic baggage transfer data generator.
Generates realistic airport transfer bag scenarios with risk features.
"""

import json
import random
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)
np.random.seed(42)

AIRLINES = ["AA", "UA", "DL", "SW", "BA", "LH", "AF", "EK", "QR", "SQ"]
TERMINALS = ["T1", "T2", "T3", "T4", "T5"]
GATES = [f"{t}{n}" for t in ["A", "B", "C", "D"] for n in range(1, 30)]

STATUSES = [
    "checked_in",
    "loaded_inbound",
    "arrived_at_carousel",
    "in_transfer_system",
    "sorted",
    "loaded_outbound",
    "on_hold",
    "manual_handling",
]

AIRPORTS = [
    ("JFK", ["T1", "T2", "T4", "T5", "T7", "T8"]),
    ("LAX", ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"]),
    ("ORD", ["T1", "T2", "T3", "T5"]),
    ("ATL", ["T1", "T2", "T3", "T4"]),
    ("DFW", ["T1", "T2", "T3", "T4", "T5"]),
]

def random_flight(airline=None):
    if airline is None:
        airline = random.choice(AIRLINES)
    num = random.randint(100, 9999)
    return f"{airline}{num}"


def generate_bag(bag_index: int, base_time: datetime) -> dict:
    # Assign a risk tier to ensure realistic spread: ~30% high, ~40% medium, ~30% low
    tier = random.choices(["high", "medium", "low"], weights=[0.30, 0.40, 0.30])[0]

    # Inbound flight timing
    scheduled_arrival = base_time + timedelta(
        hours=random.randint(0, 8), minutes=random.choice([0, 15, 30, 45])
    )

    if tier == "high":
        arrival_delay = random.randint(30, 120)
        layover_minutes = random.randint(25, 50)
    elif tier == "low":
        arrival_delay = random.randint(0, 10)
        layover_minutes = random.randint(90, 240)
    else:
        arrival_delay = random.randint(5, 40)
        layover_minutes = random.randint(45, 100)

    actual_arrival = scheduled_arrival + timedelta(minutes=arrival_delay)
    scheduled_departure = scheduled_arrival + timedelta(minutes=layover_minutes)

    # Airline pair
    inbound_airline = random.choice(AIRLINES)
    outbound_airline = random.choice(AIRLINES)
    inbound_flight = random_flight(inbound_airline)
    outbound_flight = random_flight(outbound_airline)

    # Terminal and gate
    airport = random.choice(AIRPORTS)
    airport_code, airport_terminals = airport
    inbound_terminal = random.choice(airport_terminals)
    outbound_terminal = random.choice(airport_terminals)
    terminal_change = inbound_terminal != outbound_terminal

    inbound_gate = random.choice(GATES)
    outbound_gate = random.choice(GATES)
    gate_change = inbound_gate[0] != outbound_gate[0]  # different gate zone

    # Bag processing times
    time_bag_received = actual_arrival + timedelta(minutes=random.randint(5, 20))
    sort_delay = random.randint(5, 30)
    if random.random() < 0.2:
        sort_delay += random.randint(15, 45)  # congestion spike
    time_bag_sorted = time_bag_received + timedelta(minutes=sort_delay)

    # Risk-affecting flags — probabilities scale with tier
    if tier == "high":
        late_checkin_flag = random.random() < 0.40
        customs_recheck_required = random.random() < 0.35
        security_recheck_required = random.random() < 0.25
        historical_route_disruption_score = round(random.uniform(0.5, 1.0), 3)
        baggage_system_congestion_score = round(random.uniform(0.5, 1.0), 3)
    elif tier == "low":
        late_checkin_flag = random.random() < 0.03
        customs_recheck_required = random.random() < 0.02
        security_recheck_required = random.random() < 0.02
        historical_route_disruption_score = round(random.uniform(0.0, 0.35), 3)
        baggage_system_congestion_score = round(random.uniform(0.0, 0.35), 3)
    else:
        late_checkin_flag = random.random() < 0.12
        customs_recheck_required = random.random() < 0.08
        security_recheck_required = random.random() < 0.06
        historical_route_disruption_score = round(random.uniform(0.2, 0.7), 3)
        baggage_system_congestion_score = round(random.uniform(0.2, 0.7), 3)

    # Derived fields
    processing_buffer_minutes = max(
        0,
        int((scheduled_departure - time_bag_sorted).total_seconds() / 60)
    )
    time_to_departure = max(
        0,
        int((scheduled_departure - datetime.now()).total_seconds() / 60)
    )

    # Current status — weighted by risk profile
    risk_hint = (
        (arrival_delay > 30) * 2
        + terminal_change * 1.5
        + customs_recheck_required * 2
        + (layover_minutes < 40) * 2
    )
    if risk_hint > 4:
        status = random.choice(["in_transfer_system", "on_hold", "manual_handling"])
    elif risk_hint > 2:
        status = random.choice(["in_transfer_system", "sorted", "arrived_at_carousel"])
    else:
        status = random.choice(["sorted", "loaded_outbound", "loaded_outbound", "in_transfer_system"])

    # Missed connection label (ground truth for ML training)
    missed_prob = _compute_missed_probability(
        layover_minutes=layover_minutes,
        arrival_delay=arrival_delay,
        terminal_change=terminal_change,
        gate_change=gate_change,
        late_checkin_flag=late_checkin_flag,
        customs_recheck_required=customs_recheck_required,
        security_recheck_required=security_recheck_required,
        historical_route_disruption_score=historical_route_disruption_score,
        baggage_system_congestion_score=baggage_system_congestion_score,
        processing_buffer_minutes=processing_buffer_minutes,
    )
    missed_connection = random.random() < missed_prob

    return {
        "bag_id": f"BAG{bag_index:05d}",
        "passenger_id": f"PAX{random.randint(10000, 99999)}",
        "inbound_flight": inbound_flight,
        "outbound_flight": outbound_flight,
        "airport": airport_code,
        "inbound_terminal": inbound_terminal,
        "outbound_terminal": outbound_terminal,
        "inbound_gate": inbound_gate,
        "outbound_gate": outbound_gate,
        "scheduled_arrival": scheduled_arrival.isoformat(),
        "actual_arrival": actual_arrival.isoformat(),
        "scheduled_departure": scheduled_departure.isoformat(),
        "layover_minutes": layover_minutes,
        "arrival_delay_minutes": arrival_delay,
        "terminal_change": terminal_change,
        "gate_change": gate_change,
        "late_checkin_flag": late_checkin_flag,
        "time_bag_received": time_bag_received.isoformat(),
        "time_bag_sorted": time_bag_sorted.isoformat(),
        "customs_recheck_required": customs_recheck_required,
        "security_recheck_required": security_recheck_required,
        "historical_route_disruption_score": historical_route_disruption_score,
        "baggage_system_congestion_score": baggage_system_congestion_score,
        "processing_buffer_minutes": processing_buffer_minutes,
        "time_to_departure": time_to_departure,
        "current_status": status,
        "missed_connection_label": missed_connection,
    }


def _compute_missed_probability(
    layover_minutes,
    arrival_delay,
    terminal_change,
    gate_change,
    late_checkin_flag,
    customs_recheck_required,
    security_recheck_required,
    historical_route_disruption_score,
    baggage_system_congestion_score,
    processing_buffer_minutes,
):
    """Realistic rule-based probability for ground-truth label generation."""
    score = 0.0

    # Layover tightness
    if layover_minutes < 30:
        score += 0.45
    elif layover_minutes < 45:
        score += 0.25
    elif layover_minutes < 60:
        score += 0.10

    # Arrival delay impact
    if arrival_delay > 60:
        score += 0.30
    elif arrival_delay > 30:
        score += 0.18
    elif arrival_delay > 15:
        score += 0.08

    # Terminal and gate changes
    if terminal_change:
        score += 0.15
    if gate_change:
        score += 0.05

    # Recheck requirements
    if customs_recheck_required:
        score += 0.20
    if security_recheck_required:
        score += 0.15

    # Late check-in
    if late_checkin_flag:
        score += 0.10

    # System/route disruption
    score += historical_route_disruption_score * 0.10
    score += baggage_system_congestion_score * 0.08

    # Processing buffer
    if processing_buffer_minutes < 10:
        score += 0.20
    elif processing_buffer_minutes < 20:
        score += 0.10

    return min(score, 0.97)


def generate_dataset(n: int = 200) -> list[dict]:
    base_time = datetime.now().replace(second=0, microsecond=0)
    return [generate_bag(i + 1, base_time) for i in range(n)]


if __name__ == "__main__":
    bags = generate_dataset(200)
    out_path = Path(__file__).parent / "data" / "bags.json"
    out_path.parent.mkdir(exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(bags, f, indent=2)
    print(f"Generated {len(bags)} bags → {out_path}")
