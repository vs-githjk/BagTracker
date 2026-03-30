"use client";

import { useState, useEffect } from "react";
import { Search, Luggage, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { fetchBags, fetchPassengerStatus } from "@/lib/api";
import { PassengerStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const STATUS_CONFIG = {
  on_track: {
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700",
    label: "Bag On Track",
  },
  monitored: {
    icon: AlertTriangle,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700",
    label: "Being Monitored",
  },
  at_risk: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700",
    label: "Intervention In Progress",
  },
};

export default function PassengerPage() {
  const [passengerId, setPassengerId] = useState("");
  const [demoIds, setDemoIds] = useState<string[]>([]);
  const [status, setStatus] = useState<PassengerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBags({ sort_by: "risk_score", sort_dir: "desc" }).then((data) => {
      const ids = data.bags.slice(0, 3).map((b) => b.passenger_id);
      setDemoIds(ids);
    });
  }, []);

  const lookup = async (id?: string) => {
    const pid = id || passengerId;
    if (!pid) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetchPassengerStatus(pid);
      setStatus(res);
      setPassengerId(pid);
    } catch {
      setError(`Passenger ${pid} not found. Try one of the demo IDs.`);
    } finally {
      setLoading(false);
    }
  };

  const cfg = status ? STATUS_CONFIG[status.notification_status] : null;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Passenger Notification</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Look up bag status by passenger ID</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Enter passenger ID (e.g. PAX12345)"
            value={passengerId}
            onChange={(e) => setPassengerId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500"
          />
        </div>
        <button
          onClick={() => lookup()}
          disabled={loading}
          className="px-4 py-2.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Looking up..." : "Look Up"}
        </button>
      </div>

      {/* Demo IDs */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 dark:text-slate-600">Try:</span>
        {demoIds.map((id) => (
          <button
            key={id}
            onClick={() => { setPassengerId(id); lookup(id); }}
            className="px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-mono transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700"
          >
            {id}
          </button>
        ))}
        <span className="text-xs text-slate-400 dark:text-slate-600">or any passenger ID from the dashboard</span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-300">{error}</div>
      )}

      {/* Notification Card */}
      {status && cfg && (
        <div className="space-y-4">
          {/* Simulated passenger-facing card */}
          <div className={`rounded-2xl border p-6 ${cfg.bg}`}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-black/10 dark:bg-black/20 rounded-xl">
                <Luggage className={`w-8 h-8 ${cfg.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                  <span className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">{status.message}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Bag Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "Passenger ID", value: status.passenger_id },
                { label: "Bag ID", value: status.bag_id },
                { label: "Outbound Flight", value: status.outbound_flight },
                { label: "Scheduled Departure", value: formatDateTime(status.scheduled_departure) },
                { label: "Risk Level", value: status.risk_level },
                { label: "Risk Score", value: `${status.risk_score.toFixed(0)} / 100` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{label}</div>
                  <div className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff note */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-xs text-slate-500">
            This is a mock passenger-facing notification. In production, this would be delivered via
            airline app push notification, SMS, or airport display.
          </div>
        </div>
      )}
    </div>
  );
}
