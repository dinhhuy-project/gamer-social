import { prisma } from "@/lib/prisma";
import { CONFIG } from "@/lib/constants/config";
import payOS from "@/lib/payos/client";
import { AppError } from "./shared/app-error";
import { assertAuth, assertExists } from "./shared/assert";

const PAYMENT_PROVIDER = "payos" as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type PayOSCheckoutResult = {
  checkoutUrl: string;
  paymentRef: string;
};

type PayOSVerifyResult = {
  status: string;
  amount?: number;
  confirmedAt?: string;
  paymentRef?: string;
};

const CHECKOUT_TIMEOUT_MS = CONFIG.MEMBERSHIP_CHECKOUT_TIMEOUT_MINUTES * 60 * 1000;

function normalizePayOSUrl(response: any) {
  return (
    response?.url ??
    response?.checkout_url ??
    response?.checkoutUrl ??
    response?.redirectUrl ??
    response?.paymentUrl ??
    response?.payment_url ??
    response?.data?.url ??
    response?.data?.checkout_url ??
    response?.data?.checkoutUrl ??
    response?.data?.redirectUrl
  );
}

function normalizePayOSPaymentRef(response: any): string | null {
  return (
    response?.payment_ref ??
    response?.paymentRef ??
    response?.paymentLinkId ??
    response?.payment_link_id ??
    response?.id ??
    response?.reference ??
    response?.transactionId ??
    response?.data?.payment_ref ??
    response?.data?.paymentLinkId ??
    response?.data?.payment_link_id ??
    response?.data?.id ??
    response?.data?.reference ??
    null
  );
}

function normalizePayOSStatus(response: any): string {
  return (
    String(
      response?.status ??
      response?.payment_status ??
      response?.state ??
      response?.result?.status ??
      response?.data?.status ??
      ""
    ) ?? ""
  ).toLowerCase();
}

function getErrorMessage(error: unknown): string {
  if (!error) return "Không rõ lỗi";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return "Không thể ghi nhận lỗi";
  }
}

async function createPayOSCheckoutSession(paymentId: string, amount: number, returnUrl: string) {
  const payos = payOS as unknown as any;

  if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
    throw new AppError(
      "PayOS chưa được cấu hình đầy đủ. Vui lòng kiểm tra PAYOS_CLIENT_ID, PAYOS_API_KEY và PAYOS_CHECKSUM_KEY.",
      500,
      "PAYMENT_PROVIDER_CONFIG_ERROR"
    );
  }

  if (!payos || typeof payos !== "object") {
    throw new AppError(
      "Không thể khởi tạo PayOS. Kiểm tra module @payos/node và cấu hình SDK.",
      500,
      "PAYMENT_PROVIDER_CONFIG_ERROR"
    );
  }

  const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 900) + 100}`);
  const payload = {
    orderCode,
    amount,
    description: "Thành viên Gamer Social",
    returnUrl,
    cancelUrl: returnUrl,
  };

  let result: any;
  try {
    result = await payos.paymentRequests.create(payload);
  } catch (err) {
    throw new AppError(
      `Không thể tạo phiên thanh toán PayOS: ${getErrorMessage(err)}`,
      502,
      "PAYMENT_PROVIDER_ERROR"
    );
  }

  const checkoutUrl = normalizePayOSUrl(result);
  const paymentRef = normalizePayOSPaymentRef(result) ?? String(orderCode);

  if (!checkoutUrl) {
    throw new AppError("PayOS trả về dữ liệu thanh toán không hợp lệ", 502, "PAYMENT_PROVIDER_ERROR");
  }

  return { checkoutUrl, paymentRef } as PayOSCheckoutResult;
}

async function verifyPayOSPayment(paymentRef: string) {
  const payos = payOS as unknown as any;

  if (!payos || typeof payos !== "object" || !payos.paymentRequests) {
    throw new AppError(
      "Không thể khởi tạo PayOS để xác thực giao dịch.",
      500,
      "PAYMENT_PROVIDER_CONFIG_ERROR"
    );
  }

  let result: any;
  try {
    result = await payos.paymentRequests.get(paymentRef);
  } catch {
    try {
      const numericRef = Number(paymentRef);
      if (!Number.isNaN(numericRef)) {
        result = await payos.paymentRequests.get(numericRef);
      }
    } catch {
      // continue to throw below
    }
  }

  if (!result) {
    throw new AppError("Không thể xác thực giao dịch PayOS", 502, "PAYMENT_PROVIDER_ERROR");
  }

  return {
    status: normalizePayOSStatus(result),
    amount: Number(result?.amount ?? result?.amountPaid ?? result?.amount_paid ?? 0),
    confirmedAt:
      result?.updatedAt ??
      result?.createdAt ??
      result?.transactions?.[0]?.transactionDateTime ??
      result?.data?.updatedAt ??
      result?.data?.createdAt ??
      result?.data?.transactionDateTime ??
      null,
    paymentRef: normalizePayOSPaymentRef(result) ?? paymentRef,
  } as PayOSVerifyResult;
}

export type MembershipStatus = {
  isActive: boolean;
  expiresAt: string | null;
  daysLeft: number | null;
};

export type MembershipCheckoutSession = {
  checkoutUrl: string;
  checkoutExpiresAt: string;
  paymentRef: string;
  amount: number;
  currency: string;
};

export async function getMembershipStatus(userId: string): Promise<MembershipStatus> {
  assertAuth(userId);

  const payment = await prisma.member_payments.findFirst({
    where: { user_id: userId, status: "confirmed" },
    orderBy: { expires_at: "desc" },
  });

  if (!payment || !payment.expires_at) {
    return { isActive: false, expiresAt: null, daysLeft: null };
  }

  const now = Date.now();
  const expiresAt = payment.expires_at.getTime();
  const daysLeft = Math.max(0, Math.ceil((expiresAt - now) / MS_PER_DAY));

  return {
    isActive: expiresAt > now,
    expiresAt: payment.expires_at.toISOString(),
    daysLeft: daysLeft || 0,
  };
}

export async function createMembershipPaymentSession(userId: string, returnUrl: string): Promise<MembershipCheckoutSession> {
  assertAuth(userId);

  const user = assertExists(await prisma.users.findUnique({ where: { id: userId } }), "Người dùng không tồn tại");

  const payment = await prisma.member_payments.create({
    data: {
      user_id: user.id,
      amount: CONFIG.MEMBERSHIP_PRICE,
      payment_provider: PAYMENT_PROVIDER,
      status: "pending",
    },
  });

  const { checkoutUrl, paymentRef } = await createPayOSCheckoutSession(payment.id, CONFIG.MEMBERSHIP_PRICE, returnUrl);
  const checkoutExpiresAt = new Date(Date.now() + CHECKOUT_TIMEOUT_MS).toISOString();

  await prisma.member_payments.update({
    where: { id: payment.id },
    data: { payment_ref: paymentRef },
  });

  return {
    checkoutUrl,
    checkoutExpiresAt,
    paymentRef,
    amount: CONFIG.MEMBERSHIP_PRICE,
    currency: "VND",
  };
}

export async function confirmMembershipPayment(paymentRef: string): Promise<MembershipStatus> {
  if (!paymentRef || typeof paymentRef !== "string") {
    throw new AppError("paymentRef là bắt buộc", 400, "INVALID_INPUT");
  }

  const payment = assertExists(
    await prisma.member_payments.findUnique({ where: { payment_ref: paymentRef } }),
    "Giao dịch thanh toán không tìm thấy"
  );

  if (payment.status === "confirmed") {
    return getMembershipStatus(payment.user_id);
  }

  const createdAt = payment.created_at?.getTime() ?? 0;
  if (Date.now() - createdAt > CHECKOUT_TIMEOUT_MS) {
    await prisma.member_payments.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    throw new AppError(
      "Phiên checkout đã hết hạn sau 10 phút. Vui lòng tạo lại phiên thanh toán.",
      408,
      "CHECKOUT_EXPIRED"
    );
  }

  const verifyResult = await verifyPayOSPayment(paymentRef);
  const confirmed = ["confirmed", "success", "completed", "paid"].includes(verifyResult.status);

  if (!confirmed) {
    await prisma.member_payments.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    throw new AppError("Giao dịch chưa được xác nhận", 402, "PAYMENT_NOT_CONFIRMED");
  }

  const now = new Date();
  const currentExpiry = payment.expires_at && payment.expires_at.getTime() > now.getTime() ? payment.expires_at : now;
  const expiresAt = new Date(currentExpiry.getTime() + CONFIG.MEMBERSHIP_DAYS * MS_PER_DAY);

  await prisma.$transaction(async (tx) => {
    await tx.member_payments.update({
      where: { id: payment.id },
      data: {
        status: "confirmed",
        confirmed_at: now,
        expires_at: expiresAt,
        amount: verifyResult.amount || payment.amount,
      },
    });

    await tx.users.update({
      where: { id: payment.user_id },
      data: {
        role: "member",
        updated_at: new Date(),
      },
    });
  });

  return {
    isActive: true,
    expiresAt: expiresAt.toISOString(),
    daysLeft: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / MS_PER_DAY)),
  };
}

export async function confirmMembershipPaymentForUser(userId: string, paymentRef: string): Promise<MembershipStatus> {
  assertAuth(userId);

  const payment = assertExists(
    await prisma.member_payments.findUnique({ where: { payment_ref: paymentRef } }),
    "Giao dịch thanh toán không tìm thấy"
  );

  if (payment.user_id !== userId) {
    throw new AppError("Không có quyền xác nhận giao dịch này", 403, "FORBIDDEN");
  }

  return confirmMembershipPayment(paymentRef);
}

export async function markMembershipPaymentFailed(paymentRef: string) {
  const payment = assertExists(
    await prisma.member_payments.findUnique({ where: { payment_ref: paymentRef } }),
    "Giao dịch thanh toán không tìm thấy"
  );

  if (payment.status === "failed") {
    return payment;
  }

  return prisma.member_payments.update({
    where: { id: payment.id },
    data: {
      status: "failed",
    },
  });
}

export async function listMembershipPayments(userId: string, page = 1, perPage = 20) {
  assertAuth(userId);

  const take = Math.max(1, Math.min(100, perPage));
  const skip = Math.max(0, (page - 1) * take);

  const [total, payments] = await prisma.$transaction([
    prisma.member_payments.count({ where: { user_id: userId } }),
    prisma.member_payments.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      skip,
      take,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));

  return {
    data: payments,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

export const membershipService = {
  getMembershipStatus,
  createMembershipPaymentSession,
  confirmMembershipPayment,
  confirmMembershipPaymentForUser,
  markMembershipPaymentFailed,
  listMembershipPayments,
};

export default membershipService;
