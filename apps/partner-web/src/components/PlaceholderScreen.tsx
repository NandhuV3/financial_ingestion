import React from "react";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { PageContainer } from "./ui/PageContainer";
import type { PlaceholderScreenName } from "../types/ui.types";

export function PlaceholderScreen({ title }: { title: PlaceholderScreenName | string }) {
  return (
    <PageContainer>
      <div className="space-y-4">
        <Badge>Foundation</Badge>
        <Card>
          <h1 className="text-3xl font-semibold tracking-normal text-partner-ink">{title}</h1>
          <p className="mt-3 text-base leading-7 text-partner-muted">Coming Soon</p>
        </Card>
      </div>
    </PageContainer>
  );
}
