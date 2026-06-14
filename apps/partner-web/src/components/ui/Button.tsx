import React from "react";
import type { ButtonHTMLAttributes } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-md bg-partner-accent px-4 py-2 text-sm font-medium text-white ${className}`}
      {...props}
    />
  );
}
