import React from "react";
import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-partner-line bg-partner-surface p-4 shadow-sm ${className}`}
      {...props}
    />
  );
}
