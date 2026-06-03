"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useStartTrade } from "@/hooks/trades";
import { toast } from "sonner";

type Props = {
  conversationId: string;
};

export function StartTradeButton({ conversationId }: Props) {
  const mutation = useStartTrade();

  async function handleStart() {
    try {
      await mutation.mutateAsync(conversationId);
      toast.success("Trade started");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err ?? "Failed to start trade");
      toast.error(message);
    }
  }

  return (
    <Button onClick={handleStart} disabled={mutation.status === "pending"}>
      {mutation.status === "pending" ? "Starting..." : "Start Trade"}
    </Button>
  );
}

export default StartTradeButton;
