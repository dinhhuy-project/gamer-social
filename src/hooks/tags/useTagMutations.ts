"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { TagDTO } from "@/types/api.types";

async function createTagApi(input: { name: string }) {
  return apiClient<TagDTO>(`/api/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
}

async function updateTagApi(slug: string, input: { name?: string }) {
  return apiClient<TagDTO>(`/api/tags/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
}

async function deleteTagApi(slug: string) {
  return apiClient<{ id: number }>(`/api/tags/${encodeURIComponent(slug)}`, { method: "DELETE", credentials: "same-origin" });
}

export function useTagMutations() {
  const qc = useQueryClient();

  const createMutation = useMutation<TagDTO, Error, { name: string }>({
    mutationFn: (input) => createTagApi(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      qc.invalidateQueries({ queryKey: ["tags", data.slug] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const updateMutation = useMutation<TagDTO, Error, { slug: string; input: { name?: string } }>(
    {
      mutationFn: ({ slug, input }) => updateTagApi(slug, input),
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ["tags"] });
        qc.invalidateQueries({ queryKey: ["tags", data.slug] });
        qc.invalidateQueries({ queryKey: ["posts"] });
      },
    }
  );

  const deleteMutation = useMutation<{ id: number }, Error, string>({
    mutationFn: (slug) => deleteTagApi(slug),
    onSuccess: (_data, slug) => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      qc.invalidateQueries({ queryKey: ["tags", slug] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    create: (input: { name: string }) => createMutation.mutate(input),
    update: (slug: string, input: { name?: string }) => updateMutation.mutate({ slug, input }),
    remove: (slug: string) => deleteMutation.mutate(slug),
  };
}

export default useTagMutations;
