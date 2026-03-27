import { RiskLevel } from "./types";

export function riskColor(level: RiskLevel | string): string {
  switch (level) {
    case "High": return "text-red-400";
    case "Medium": return "text-yellow-400";
    case "Low": return "text-emerald-400";
    default: return "text-slate-400";
  }
}

export function riskBg(level: RiskLevel | string): string {
  switch (level) {
    case "High": return "bg-red-950 border-red-800 text-red-300";
    case "Medium": return "bg-yellow-950 border-yellow-800 text-yellow-300";
    case "Low": return "bg-emerald-950 border-emerald-800 text-emerald-300";
    default: return "bg-slate-800 border-slate-600 text-slate-300";
  }
}

export function riskScoreBar(score: number): string {
  if (score >= 65) return "bg-red-500";
  if (score >= 35) return "bg-yellow-500";
  return "bg-emerald-500";
}

export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function statusColor(status: string): string {
  switch (status) {
    case "loaded_outbound": return "bg-emerald-800 text-emerald-200";
    case "sorted": return "bg-blue-800 text-blue-200";
    case "in_transfer_system": return "bg-indigo-800 text-indigo-200";
    case "arrived_at_carousel": return "bg-cyan-800 text-cyan-200";
    case "on_hold": return "bg-orange-800 text-orange-200";
    case "manual_handling": return "bg-red-800 text-red-200";
    default: return "bg-slate-700 text-slate-300";
  }
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString([], {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function featureLabel(key: string): string {
  const map: Record<string, string> = {
    layover_minutes: "Layover Duration",
    arrival_delay_minutes: "Arrival Delay",
    terminal_change: "Terminal Change",
    gate_change: "Gate Change",
    late_checkin_flag: "Late Check-in",
    customs_recheck_required: "Customs Re-check",
    security_recheck_required: "Security Re-check",
    historical_route_disruption_score: "Route Disruption History",
    baggage_system_congestion_score: "BHS Congestion",
    processing_buffer_minutes: "Processing Buffer",
  };
  return map[key] ?? key;
}
