import React from "react";
import { useParams } from "react-router-dom";
import { PlaceholderScreen } from "../../components/PlaceholderScreen";

export function CompanyDetailScreen() {
  const { ticker = "" } = useParams();
  const normalizedTicker = ticker.toUpperCase();

  return <PlaceholderScreen title={normalizedTicker ? `Company ${normalizedTicker}` : "Company"} />;
}
