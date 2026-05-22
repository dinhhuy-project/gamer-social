"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TagDTO } from "@/types/api.types";

async function createTagApi(input: { name: string }) {
  const res = await fetch(`/api/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to create tag");
  }

  return (await res.json()) as TagDTO;
}

async function updateTagApi(slug: string, input: { name?: string }) {
  const res = await fetch(`/api/tags/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to update tag");
  }

  return (await res.json()) as TagDTO;
}

async function deleteTagApi(slug: string) {
  const res = await fetch(`/api/tags/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to delete tag");
  }

  return (await res.json()) as { id: number };
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
