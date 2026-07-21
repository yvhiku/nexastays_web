import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  question: string;
  answer: string;
  className?: string;
};

export function GeoBlock({ question, answer, className }: Props) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-nexa-border/80 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-nexa-ink mb-2">{question}</h3>
      <p className="text-sm text-nexa-muted leading-relaxed">{answer}</p>
    </article>
  );
}
