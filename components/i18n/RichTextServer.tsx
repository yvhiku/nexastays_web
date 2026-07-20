import React from "react";
import { renderRichText } from "@/lib/i18n/server";

type Props = {
  text: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
};

/** Server-safe rich text from i18n strings. */
export function RichTextServer({ text, className, as: Tag = "span" }: Props) {
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: renderRichText(text) }}
    />
  );
}
