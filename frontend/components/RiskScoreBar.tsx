import { riskScoreBar } from "@/lib/utils";

export default function RiskScoreBar({ score }: { score: number }) {
  const color = riskScoreBar(score);
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-300 w-8 text-right">{score.toFixed(0)}</span>
    </div>
  );
}
