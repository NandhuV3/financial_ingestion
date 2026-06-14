import React from "react";
import type { HTMLAttributes } from "react";

export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-partner-line px-2.5 py-1 text-xs font-medium text-partner-muted ${className}`}
      {...props}
    />
  );
}
