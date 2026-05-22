import { NextResponse } from "next/server";
import { uploadToSupabaseStorage } from "@/lib/utils/upload";

const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
  process.env.SUPABASE_STORAGE_BUCKET ||
  "public";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
    }

    const url = await uploadToSupabaseStorage(file, STORAGE_BUCKET);
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to upload file" },
      { status: 500 }
    );
  }
}
