# BagTrack — Airport Baggage Risk Dashboard

A full-stack prototype for proactive baggage missed-connection risk detection.
Built for ENGR 408 ACRP Project.

## Architecture

```
backend/           FastAPI + Python risk engine
  main.py          REST API (bags, analytics, interventions)
  risk_engine.py   Random Forest + rules-based explanation layer
  data_generator.py  Synthetic dataset generator
  data/bags.json   200 generated transfer bags

frontend/          Next.js 16 + Tailwind CSS v4
  app/             Pages: Dashboard, Analytics, Passenger
  components/      Reusable UI: RiskBadge, StatusChip, RiskScoreBar, Sidebar
  lib/             API client, types, utilities
```

## Running Locally

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API available at http://localhost:8000
Docs at http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at http://localhost:3000

---

## Features

### Operations Dashboard (/)
- Table of all transfer bags with sortable columns
- Filter by risk level (High / Medium / Low)
- Search by bag ID, flight number, or passenger ID
- Color-coded risk scores and status chips
- Live auto-refresh every 8 seconds
- Export to CSV
- Regenerate synthetic dataset on demand

### Bag Detail (/bags/[bagId])
- Full bag + flight information
- Risk score with visual gauge
- Explanation of top risk factors
- Key flags (customs/security re-check, terminal change, etc.)
- Step-by-step journey timeline
- One-click intervention simulation (reduces risk score)

### Analytics (/analytics)
- KPI summary: total bags, high risk count, average score, predicted vs. actual missed
- Risk score distribution bar chart
- Risk level pie chart
- Random Forest feature importance visualization

### Passenger Notification (/passenger)
- Passenger-facing status lookup by passenger ID
- Three notification states: On Track / Being Monitored / Intervention In Progress
- Mock of how alerts would be delivered via app/SMS

---

## Risk Scoring Engine

**Hybrid approach:**
1. **Random Forest classifier** (scikit-learn, 200 trees) trained on the synthetic dataset.
   Outputs a 0–100 probability score for missed connection.
2. **Rules-based explanation layer** that independently fires readable reasons
   (tight layover, big delay, customs re-check, etc.) and maps them to recommended actions.

**Input features:**
- layover_minutes, arrival_delay_minutes
- terminal_change, gate_change
- late_checkin_flag, customs_recheck_required, security_recheck_required
- historical_route_disruption_score, baggage_system_congestion_score
- processing_buffer_minutes

**Risk levels:** Low (< 35), Medium (35–64), High (≥ 65)

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /bags | List bags (supports filter, search, sort) |
| GET | /bags/{bag_id} | Bag detail with timeline |
| GET | /analytics | Summary metrics + feature importances |
| GET | /passenger/{passenger_id} | Passenger notification status |
| POST | /bags/{bag_id}/intervene | Simulate intervention |
| POST | /refresh | Regenerate dataset + retrain model |
| GET | /live-updates | Simulated real-time status updates |
