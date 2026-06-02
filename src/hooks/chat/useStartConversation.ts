"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useConversationActions, useFindConversation } from "./useConversation";
import type { ConversationDto } from "@/types/conversation.types";

export function useStartConversation(otherUserId?: string) {
  const currentUserQuery = useCurrentUser();
  const queryClient = useQueryClient();
  const { createConversation: createConversationMutation } = useConversationActions();
  const findConversationQuery = useFindConversation(otherUserId);

  const mutation = useMutation<ConversationDto, Error, void>({
    mutationFn: async () => {
      if (!currentUserQuery.data) throw new Error("Unauthorized");
      if (!otherUserId) throw new Error("User ID is required to start a conversation");
      return createConversationMutation({ participantIds: [currentUserQuery.data.id, otherUserId] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", "find"] });
    },
  });

  const startConversation = async (): Promise<ConversationDto> => {
    if (!otherUserId) throw new Error("User ID is required to start a conversation");
    if (!currentUserQuery.data) throw new Error("Unauthorized");
    if (currentUserQuery.data.id === otherUserId) throw new Error("Cannot start a conversation with yourself");

    if (findConversationQuery.data) {
      return findConversationQuery.data;
    }

    const result = await findConversationQuery.refetch();
    if (result.data) {
      return result.data;
    }

    if (result.error) {
      if (result.error.message === "Conversation not found") {
        return mutation.mutateAsync();
      }
      throw result.error;
    }

    return mutation.mutateAsync();
  };

  return {
    startConversation,
    isStarting: findConversationQuery.isFetching || mutation.status === "pending",
    error: findConversationQuery.error ?? mutation.error,
  };
}
