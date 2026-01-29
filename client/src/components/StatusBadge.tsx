import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let variant = "bg-slate-100 text-slate-700 border-slate-200"; // default

  const s = status.toLowerCase();

  if (s.includes("compliant") || s.includes("pass") || s.includes("uploaded")) {
    variant = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (s.includes("deviation") || s.includes("warning") || s.includes("pending")) {
    variant = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (s.includes("fail") || s.includes("error") || s.includes("missing")) {
    variant = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (s.includes("analysis")) {
    variant = "bg-blue-50 text-blue-700 border-blue-200";
  }

  return (
    <span className={cn("status-badge", variant, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block mr-1.5 mb-0.5" />
      {status}
    </span>
  );
}
