import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** RTL-safe middot separator (uses Unicode middot U+00B7). */
export function TextSeparator({ className }: Props) {
  return (
    <span aria-hidden className={cn("mx-1.5 text-nexa-ink-4", className)}>
      {"\u00B7"}
    </span>
  );
}
