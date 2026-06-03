"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

type Props = {
  status?: "initiated" | "both_confirmed" | "completed" | "cancelled" | null;
};

export function TradeStatusBadge({ status }: Props) {
  if (!status) return null;

  const variant = status === "initiated" ? "secondary" : status === "cancelled" ? "destructive" : "default";
  const label =
    status === "initiated" ? "Initiated" : status === "both_confirmed" ? "Both confirmed" : status === "completed" ? "Completed" : "Cancelled";

  return <Badge variant={variant}>{label}</Badge>;
}

export default TradeStatusBadge;
