"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { fetchAnalytics } from "@/lib/api";
import { Analytics } from "@/lib/types";
import { featureLabel } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

const PIE_COLORS = ["#ef4444", "#f59e0b", "#10b981"];

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return <div className="p-6 text-slate-400 dark:text-slate-500">Failed to load analytics.</div>;

  const pieData = [
    { name: "High Risk", value: data.high_risk },
    { name: "Medium Risk", value: data.medium_risk },
    { name: "Low Risk", value: data.low_risk },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Summary metrics and model insights</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Total Bags", value: data.total_bags, colorClass: "text-slate-700 dark:text-slate-200" },
          { label: "High Risk", value: data.high_risk, colorClass: "text-red-500 dark:text-red-400" },
          { label: "Avg Risk Score", value: data.average_risk_score.toFixed(1), colorClass: "text-blue-600 dark:text-blue-400" },
          { label: "Predicted Missed", value: data.predicted_missed_bags, colorClass: "text-orange-500 dark:text-orange-400" },
          { label: "Actual Missed (GT)", value: data.actual_missed_bags, colorClass: "text-purple-500 dark:text-purple-400" },
        ].map(({ label, value, colorClass }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</div>
            <div className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Risk Distribution Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-4">Risk Score Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.risk_distribution} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="range" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8 }}
                labelStyle={{ color: "#64748b" }}
                itemStyle={{ color: "#1e293b" }}
              />
              <Bar dataKey="count" name="Bags" radius={[3, 3, 0, 0]}>
                {data.risk_distribution.map((entry, i) => {
                  const mid = parseInt(entry.range.split("-")[0]);
                  const fill = mid >= 60 ? "#ef4444" : mid >= 30 ? "#f59e0b" : "#10b981";
                  return <Cell key={i} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Level Pie */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-4">Risk Level Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ color: "#64748b", fontSize: 12 }}>{v}</span>}
              />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8 }}
                itemStyle={{ color: "#1e293b" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Importance */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-4">
          Feature Importance (Random Forest)
        </h2>
        <div className="space-y-3">
          {data.feature_importances.map(({ feature, importance }) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-52 text-xs text-slate-500 dark:text-slate-400 text-right shrink-0">{featureLabel(feature)}</div>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(importance * 100 / Math.max(...data.feature_importances.map(f => f.importance))) * 100}%` }}
                />
              </div>
              <div className="w-12 text-xs text-slate-400 dark:text-slate-500 font-mono">{(importance * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Driver Frequency */}
      {data.risk_driver_frequency?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Top Risk Drivers</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">How often each factor appears — across all bags vs. high-risk bags only</p>
          <div className="space-y-3">
            {data.risk_driver_frequency.map(({ label, pct_all, pct_high }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">{label}</span>
                  <div className="flex gap-3 shrink-0 ml-2">
                    <span className="text-slate-400 dark:text-slate-500">{pct_all}% all</span>
                    <span className="text-red-500 dark:text-red-400 font-medium">{pct_high}% high-risk</span>
                  </div>
                </div>
                <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="absolute h-full bg-slate-300 dark:bg-slate-600 rounded-full" style={{ width: `${pct_all}%` }} />
                  <div className="absolute h-full bg-red-400 dark:bg-red-500 rounded-full opacity-80" style={{ width: `${pct_high}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-slate-300 dark:bg-slate-600 inline-block" /> All bags</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-red-400 dark:bg-red-500 inline-block opacity-80" /> High-risk bags</span>
          </div>
        </div>
      )}

      {/* Operational Insights */}
      {data.operational_insights?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Operational Insights</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Data-driven recommendations based on current bag patterns</p>
          <div className="space-y-3">
            {data.operational_insights.map(({ severity, metric, recommendation }, i) => {
              const styles = {
                high: {
                  card: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900",
                  icon: <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />,
                  metric: "text-red-700 dark:text-red-300",
                },
                medium: {
                  card: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-900",
                  icon: <AlertCircle className="w-4 h-4 text-yellow-500 dark:text-yellow-400 shrink-0 mt-0.5" />,
                  metric: "text-yellow-700 dark:text-yellow-300",
                },
                low: {
                  card: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900",
                  icon: <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />,
                  metric: "text-blue-700 dark:text-blue-300",
                },
              }[severity];
              return (
                <div key={i} className={`flex gap-3 p-4 rounded-lg border ${styles.card}`}>
                  {styles.icon}
                  <div>
                    <div className={`text-xs font-semibold mb-1 ${styles.metric}`}>{metric}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{recommendation}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Model note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 leading-relaxed dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-500">
        <strong className="text-slate-600 dark:text-slate-400">Model:</strong> Random Forest classifier (200 estimators, max depth 6) trained on 200 synthetic transfer bags.
        Scores represent probability of missed connection (0–100). Feature importances shown above indicate which factors most drive predictions.
        The rules-based explanation layer provides human-readable reasons derived from threshold checks independent of the ML score.
      </div>
    </div>
  );
}
