import { NextResponse } from "next/server";
import payOS from "@/lib/payos/client";
import { membershipService } from "@/lib/services";
import { AppError } from "@/lib/services/shared/app-error";

function extractPaymentRef(data: any): string | null {
  return (
    data?.paymentLinkId ??
    data?.payment_link_id ??
    data?.orderCode ??
    data?.order_code ??
    data?.reference ??
    data?.transactionId ??
    data?.id ??
    null
  );
}

function extractWebhookStatus(data: any): string | null {
  return (
    String(
      data?.code ??
      data?.status ??
      data?.payment_status ??
      data?.result?.status ??
      data?.data?.status ??
      ""
    ) ?? ""
  ).toLowerCase() || null;
}

function isPaymentSuccess(status: string | null) {
  return ["confirmed", "success", "completed", "paid", "00"].includes(status ?? "");
}

function isPaymentFailed(status: string | null) {
  return ["failed", "cancelled", "declined", "error"].includes(status ?? "");
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let rawPayload: any;

    try {
      rawPayload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!rawPayload || typeof rawPayload !== "object") {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const webhookBody = {
      code: rawPayload.code,
      desc: rawPayload.desc,
      success: Boolean(rawPayload.success),
      data: rawPayload.data,
      signature: rawPayload.signature,
    };

    const verifiedWebhook = await payOS.webhooks.verify(webhookBody);
    const paymentRef = extractPaymentRef(verifiedWebhook);
    const status = extractWebhookStatus(verifiedWebhook);

    if (!paymentRef) {
      return NextResponse.json({ error: "Missing payment identifier" }, { status: 400 });
    }

    if (isPaymentSuccess(status)) {
      await membershipService.confirmMembershipPayment(paymentRef);
    } else if (isPaymentFailed(status)) {
      await membershipService.markMembershipPaymentFailed?.(paymentRef);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("POST /api/webhooks/payos error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
