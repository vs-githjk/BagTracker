import { RiskLevel } from "@/lib/types";
import { riskBg } from "@/lib/utils";

export default function RiskBadge({ level }: { level: RiskLevel | string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${riskBg(level)}`}>
      {level}
    </span>
  );
}
