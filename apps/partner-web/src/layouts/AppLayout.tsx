import React from "react";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-partner-paper text-partner-ink">
      <div className="flex min-h-screen flex-col">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
