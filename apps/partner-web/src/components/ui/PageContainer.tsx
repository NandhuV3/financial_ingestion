import React from "react";
import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-24 pt-6 md:px-6 md:pb-10">
      {children}
    </main>
  );
}
