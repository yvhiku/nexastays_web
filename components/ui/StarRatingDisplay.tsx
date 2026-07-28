import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
  showNumeric?: boolean;
  tone?: "default" | "onDark";
};

/** Icon-based star rating — avoids font-dependent ★ glyphs. */
export function StarRatingDisplay({
  rating,
  max = 5,
  size = "sm",
  className,
  showNumeric = false,
  tone = "default",
}: Props) {
  const full = Math.max(0, Math.min(max, Math.round(rating)));
  const iconClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const emptyStarClass =
    tone === "onDark" ? "fill-transparent text-white/40" : "fill-transparent text-nexa-ink-4";

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            iconClass,
            i < full ? "fill-amber-400 text-amber-400" : emptyStarClass,
          )}
          aria-hidden
        />
      ))}
      {showNumeric && (
        <span className="ms-1 tabular-nums">{rating.toFixed(1)}</span>
      )}
    </span>
  );
}
