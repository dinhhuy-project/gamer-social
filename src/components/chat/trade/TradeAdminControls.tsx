"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useCompleteTrade, useCancelTrade } from "@/hooks/trades";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { toast } from "sonner";
import type { ConversationDto } from "@/types/conversation.types";

type Props = {
  conversation: ConversationDto;
};

export function TradeAdminControls({ conversation }: Props) {
  const { data: currentUser } = useCurrentUser();
  const trade = conversation.trade;
  const canManage = currentUser?.role === "admin" && trade?.txAdminId === currentUser?.id;

  const completeMutation = useCompleteTrade();
  const cancelMutation = useCancelTrade();

  const [reason, setReason] = useState<string | undefined>(undefined);

  if (!canManage) return null;

  async function handleComplete() {
    try {
      await completeMutation.mutateAsync(conversation.id);
      toast.success("Trade completed");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to complete trade");
    }
  }

  async function handleCancelClose() {
    try {
      await cancelMutation.mutateAsync({ conversationId: conversation.id, reason });
      toast.success("Trade cancelled");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err ?? "Failed to cancel trade");
      toast.error(message);
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleComplete} disabled={completeMutation.status === "pending"}>
        {completeMutation.status === "pending" ? "Completing..." : "Complete Trade"}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Cancel Trade</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Trade</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to cancel this trade? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-2">
            <textarea
              className="w-full rounded-md border bg-muted p-2 text-sm"
              placeholder="Optional reason"
              value={reason ?? ""}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Dismiss</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleCancelClose()} variant="destructive">
              {cancelMutation.status === "pending" ? "Cancelling..." : "Confirm Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TradeAdminControls;
