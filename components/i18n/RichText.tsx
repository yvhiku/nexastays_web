"use client";

import React from "react";
import { formatMessage } from "@/lib/i18n";

type RichTextProps = {
  text: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
};

/** Renders i18n strings with {em}…{/em} emphasis and newline breaks. */
export function RichText({ text, className, as: Tag = "span" }: RichTextProps) {
  const html = formatMessage(text);
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}