"use client";

import {
  NexaSelect,
  type NexaSelectOption,
  type NexaSelectProps,
} from "@/components/ui/NexaSelect";

/** @deprecated Prefer NexaSelect — kept for existing call sites. */
export type GuestOption = NexaSelectOption;

export type GuestSelectProps = Omit<NexaSelectProps, "variant"> & {
  variant?: NexaSelectProps["variant"];
};

export function GuestSelect({ variant = "plain", ...props }: GuestSelectProps) {
  return <NexaSelect variant={variant} {...props} />;
}
