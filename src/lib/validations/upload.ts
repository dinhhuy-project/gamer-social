import { createClient } from "@/lib/supabase/client";

export async function uploadToSupabaseStorage(
  file: File,
  bucket: string
) {
  const supabase = createClient();

  const fileExt = file.name.split(".").pop();

  const fileName = `${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}