import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Supabase redirect về đây sau khi user xác nhận email hoặc đăng nhập OAuth
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/feed";
  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  // Xử lý lỗi từ Supabase (ví dụ: user bấm huỷ trên trang Google)
  if (error) {
    console.error("OAuth error:", error, errorDesc);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { data, error: exchangeError } = await (await supabase).auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    console.error("Exchange error:", exchangeError);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // Đảm bảo profile tồn tại trong public.users
  // (Trigger handle_new_auth_user sẽ tạo tự động, nhưng upsert ở đây để chắc chắn)
  try {
    const user = data.user;
    const emailPrefix = user.email?.split("@")[0] ?? "user";
    const shortId = user.id.replace(/-/g, "").slice(0, 6);

    await prisma.users.upsert({
      where: { auth_id: user.id },
      update: {
        // Cập nhật avatar nếu đăng nhập Google lần đầu
        avatar_url: user.user_metadata?.avatar_url ?? undefined,
      },
      create: {
        auth_id: user.id,
        email: user.email!,
        username: `${emailPrefix}_${shortId}`,
        display_name: user.user_metadata?.full_name
          ?? user.user_metadata?.name
          ?? emailPrefix,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      },
    });
  } catch (err) {
    // Log lỗi nhưng không block — trigger SQL sẽ xử lý
    console.error("Upsert user profile error:", err);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
