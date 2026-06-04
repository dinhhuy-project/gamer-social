"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

type UploadResponse = { url: string };

async function uploadMediaApi(file: File) {
  const form = new FormData();
  form.append("file", file);

  return apiClient<UploadResponse>("/api/upload", { method: "POST", body: form });
}

export function useUploadMedia() {
  return useMutation<UploadResponse, Error, File>({
    mutationFn: uploadMediaApi,
  });
}
