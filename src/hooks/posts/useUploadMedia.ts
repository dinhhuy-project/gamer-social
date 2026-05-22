"use client";

import { useMutation } from "@tanstack/react-query";

type UploadResponse = { url: string };

async function uploadMediaApi(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to upload media");
  }

  return (await res.json()) as UploadResponse;
}

export function useUploadMedia() {
  return useMutation<UploadResponse, Error, File>({
    mutationFn: uploadMediaApi,
  });
}
