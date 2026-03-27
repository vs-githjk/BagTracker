"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";
import { fetchBag, triggerIntervention } from "@/lib/api";
import { Bag } from "@/lib/types";
import { formatDateTime, formatTime, riskBg, statusColor, statusLabel } from "@/lib/utils";
import RiskBadge from "@/components/RiskBadge";
import RiskScoreBar from "@/components/RiskScoreBar";

export default function BagDetailPage({ params }: PageProps<"/bags/[bagId]">) {
  const [bagId, setBagId] = useState<string | null>(null);
  const [bag, setBag] = useState<Bag | null>(null);
  const [loading, setLoading] = useState(true);
  const [intervening, setIntervening] = useState(false);
  const [intervened, setIntervened] = useState(false);
  const [interventionResult, setInterventionResult] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ bagId: id }) => setBagId(id));
  }, [params]);

  useEffect(() => {
    if (!bagId) return;
    setLoading(true);
    fetchBag(bagId)
      .then(setBag)
      .catch(() => setBag(null))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchBag(bagId).then(setBag).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [bagId]);

  const handleIntervene = async () => {
    if (!bag) return;
    setIntervening(true);
    try {
      const res = await triggerIntervention(bag.bag_id) as { old_risk_score: number; new_risk_score: number };
      setInterventionResult(
        `Intervention logged. Risk reduced from ${res.old_risk_score.toFixed(0)} → ${res.new_risk_score.toFixed(0)}`
      );
      setIntervened(true);
      const updated = await fetchBag(bag.bag_id);
      setBag(updated);
    } finally {
      setIntervening(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!bag) {
    return (
      <div className="p-6">
        <Link href="/" className="text-blue-400 hover:underline text-sm flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="mt-8 text-center text-slate-500">Bag not found.</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Back */}
      <Link href="/" className="text-blue-400 hover:underline text-sm flex items-center gap-1 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">{bag.bag_id}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Passenger: <span className="text-slate-300 font-mono">{bag.passenger_id}</span>
            {" · "}
            Airport: <span className="text-slate-300">{bag.airport}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge level={bag.risk_level} />
          <button
            onClick={handleIntervene}
            disabled={intervening || intervened}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-orange-700 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-3.5 h-3.5" />
            {intervening ? "Intervening..." : intervened ? "Intervention Done" : "Trigger Intervention"}
          </button>
        </div>
      </div>

      {interventionResult && (
        <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-300 text-sm">
          {interventionResult}
        </div>
      )}

      {/* Risk Score + Reasons */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Risk Assessment</h2>
          <div className="flex items-end gap-3 mb-4">
            <div className="text-5xl font-bold" style={{ color: bag.risk_level === "High" ? "#f87171" : bag.risk_level === "Medium" ? "#fbbf24" : "#34d399" }}>
              {bag.risk_score.toFixed(0)}
            </div>
            <div className="pb-1">
              <div className="text-slate-500 text-sm">/ 100</div>
              <RiskBadge level={bag.risk_level} />
            </div>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all ${bag.risk_level === "High" ? "bg-red-500" : bag.risk_level === "Medium" ? "bg-yellow-500" : "bg-emerald-500"}`}
              style={{ width: `${bag.risk_score}%` }}
            />
          </div>
          <div className="space-y-2">
            {(bag.risk_reasons || []).map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                {r}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Recommended Action</h2>
          <div className="p-3 bg-blue-950 border border-blue-800 rounded-lg text-blue-200 text-sm leading-relaxed mb-4">
            {bag.recommended_action}
          </div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Key Flags</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Terminal Change", value: bag.terminal_change },
              { label: "Gate Change", value: bag.gate_change },
              { label: "Late Check-in", value: bag.late_checkin_flag },
              { label: "Customs Re-check", value: bag.customs_recheck_required },
              { label: "Security Re-check", value: bag.security_recheck_required },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs">
                {value ? (
                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                ) : (
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                )}
                <span className={value ? "text-red-300" : "text-slate-500"}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flight Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Flight Details</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-slate-500 mb-1">Inbound Flight</div>
            <div className="text-lg font-bold text-white font-mono">{bag.inbound_flight}</div>
            <div className="text-xs text-slate-400 mt-1">Terminal {bag.inbound_terminal} · Gate {bag.inbound_gate}</div>
            <div className="text-xs text-slate-400 mt-1">
              Scheduled: {formatDateTime(bag.scheduled_arrival)}
            </div>
            <div className="text-xs mt-0.5">
              Actual: <span className={bag.arrival_delay_minutes > 15 ? "text-orange-400" : "text-slate-400"}>
                {formatDateTime(bag.actual_arrival)}
              </span>
              {bag.arrival_delay_minutes > 0 && (
                <span className="ml-1 text-orange-400">+{bag.arrival_delay_minutes}m late</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs text-slate-500 mb-2">Layover</div>
            <div className={`text-2xl font-bold ${bag.layover_minutes < 45 ? "text-orange-400" : "text-slate-200"}`}>
              {bag.layover_minutes}m
            </div>
            <div className="text-xs text-slate-500 mt-1">Processing buffer: {bag.processing_buffer_minutes}m</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Outbound Flight</div>
            <div className="text-lg font-bold text-white font-mono">{bag.outbound_flight}</div>
            <div className="text-xs text-slate-400 mt-1">Terminal {bag.outbound_terminal} · Gate {bag.outbound_gate}</div>
            <div className="text-xs text-slate-400 mt-1">Departure: {formatDateTime(bag.scheduled_departure)}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800">
          {[
            { label: "BHS Congestion", value: `${(bag.baggage_system_congestion_score * 100).toFixed(0)}%` },
            { label: "Route Disruption History", value: `${(bag.historical_route_disruption_score * 100).toFixed(0)}%` },
            { label: "Current Status", value: <span className={`px-2 py-0.5 rounded text-xs ${statusColor(bag.current_status)}`}>{statusLabel(bag.current_status)}</span> },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-slate-500 mb-1">{label}</div>
              <div className="text-sm text-slate-200">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {bag.timeline && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Bag Journey Timeline</h2>
          <div className="space-y-3">
            {bag.timeline.map((event, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  {event.status === "completed" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : event.status === "in_progress" ? (
                    <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${event.status === "pending" ? "text-slate-500" : "text-slate-200"}`}>
                    {event.event}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{formatDateTime(event.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
