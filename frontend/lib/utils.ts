import { RiskLevel } from "./types";

export function riskColor(level: RiskLevel | string): string {
  switch (level) {
    case "High": return "text-red-500 dark:text-red-400";
    case "Medium": return "text-yellow-500 dark:text-yellow-400";
    case "Low": return "text-emerald-500 dark:text-emerald-400";
    default: return "text-slate-500 dark:text-slate-400";
  }
}

export function riskBg(level: RiskLevel | string): string {
  switch (level) {
    case "High": return "bg-red-50 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300";
    case "Medium": return "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300";
    case "Low": return "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300";
    default: return "bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300";
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
    case "loaded_outbound": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200";
    case "sorted": return "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200";
    case "in_transfer_system": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200";
    case "arrived_at_carousel": return "bg-cyan-100 text-cyan-700 dark:bg-cyan-800 dark:text-cyan-200";
    case "on_hold": return "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200";
    case "manual_handling": return "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200";
    default: return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
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
