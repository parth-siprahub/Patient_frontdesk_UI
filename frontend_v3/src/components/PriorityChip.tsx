import { cn } from "@/lib/utils";

interface PriorityChipProps {
  triageScore: number;
  className?: string;
}

export function PriorityChip({ triageScore, className }: PriorityChipProps) {
  const isCritical = triageScore >= 1 && triageScore <= 3;
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
        isCritical 
          ? "bg-destructive/10 text-destructive" 
          : "bg-green-500/10 text-green-600 dark:text-green-400",
        className
      )}
    >
      {isCritical ? "Critical" : "Stable"}
    </span>
  );
}
