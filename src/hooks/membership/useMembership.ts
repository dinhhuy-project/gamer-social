"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MembershipStatus } from "@/types/api.types";

const MEMBERSHIP_STATUS_QUERY_KEY = ["membership", "status"] as const;

type MembershipCheckoutSession = {
  checkoutUrl: string;
  checkoutExpiresAt: string;
  paymentRef: string;
  amount: number;
  currency: string;
};

type CheckoutInput = {
  returnUrl: string;
};

type ConfirmInput = {
  paymentRef: string;
};

async function fetchMembershipStatus(): Promise<MembershipStatus> {
  const res = await fetch("/api/membership/status", {
    method: "GET",
    credentials: "same-origin",
  });

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to load membership status");
  }

  return (await res.json()) as MembershipStatus;
}

async function createMembershipCheckoutSession(input: CheckoutInput): Promise<MembershipCheckoutSession> {
  const res = await fetch("/api/membership/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to create membership checkout session");
  }

  return (await res.json()) as MembershipCheckoutSession;
}

async function confirmMembershipPayment(input: ConfirmInput): Promise<MembershipStatus> {
  const res = await fetch("/api/membership/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to confirm membership payment");
  }

  return (await res.json()) as MembershipStatus;
}

export function useMembershipStatus() {
  return useQuery<MembershipStatus, Error>({
    queryKey: MEMBERSHIP_STATUS_QUERY_KEY,
    queryFn: fetchMembershipStatus,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

const PAYOS_CHECKOUT_SCRIPT_URL = "https://cdn.payos.vn/payos-checkout/v1/stable/payos-initialize.js";

export type PayOSCheckoutEvent = {
  loading: boolean;
  code: string;
  id: string;
  cancel: boolean | string;
  orderCode: number | string;
  status: string;
};

export type PayOSCheckoutConfig = {
  RETURN_URL: string;
  ELEMENT_ID: string;
  CHECKOUT_URL: string;
  embedded?: boolean;
  onSuccess?: (event: PayOSCheckoutEvent) => void;
  onCancel?: (event: PayOSCheckoutEvent) => void;
  onExit?: (event: PayOSCheckoutEvent) => void;
};

function loadPayOSCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PayOS checkout chỉ chạy trên trình duyệt"));
  }

  if ((window as any).__payosCheckoutScriptLoaded) {
    return Promise.resolve();
  }

  const existing = document.querySelector(`script[src='${PAYOS_CHECKOUT_SCRIPT_URL}']`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Không thể tải PayOS checkout script")));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PAYOS_CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      (window as any).__payosCheckoutScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Không thể tải PayOS checkout script"));
    document.head.appendChild(script);
  });
}

function getPayOSCheckoutInstance(config: PayOSCheckoutConfig): { open: () => void; exit: () => void } {
  const global = window as any;
  const payOSGlobal = global.PayOSCheckout ?? global.payOS ?? global.PayOS ?? null;

  if (!payOSGlobal) {
    throw new Error("PayOS checkout chưa được khởi tạo. Vui lòng thử lại sau khi trang đã tải xong.");
  }

  if (typeof payOSGlobal.usePayOS === "function") {
    return payOSGlobal.usePayOS(config);
  }

  if (typeof global.usePayOS === "function") {
    return global.usePayOS(config);
  }

  throw new Error("Không tìm thấy hàm usePayOS trong PayOS checkout script.");
}

export function usePayOSCheckout() {
  const [isReady, setIsReady] = React.useState(false);
  const [scriptError, setScriptError] = React.useState<string | null>(null);
  const instanceRef = React.useRef<{ open: () => void; exit: () => void } | null>(null);

  React.useEffect(() => {
    loadPayOSCheckoutScript()
      .then(() => setIsReady(true))
      .catch((err) => setScriptError(err?.message ?? "Không thể tải PayOS checkout script"));
  }, []);

  const open = React.useCallback(
    async (config: PayOSCheckoutConfig) => {
      if (!isReady) {
        await loadPayOSCheckoutScript();
        setIsReady(true);
      }

      try {
        const instance = instanceRef.current ?? getPayOSCheckoutInstance(config);
        instanceRef.current = instance;
        instance.open();
      } catch (err) {
        throw new Error((err as Error)?.message ?? "Không thể mở PayOS checkout");
      }
    },
    [isReady]
  );

  const exit = React.useCallback(() => {
    instanceRef.current?.exit?.();
  }, []);

  return {
    isReady,
    scriptError,
    open,
    exit,
  } as const;
}

export function useMembershipCheckout() {
  const queryClient = useQueryClient();

  return useMutation<MembershipCheckoutSession, Error, CheckoutInput>({
    mutationFn: createMembershipCheckoutSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIP_STATUS_QUERY_KEY });
    },
  });
}

export function useConfirmMembershipPayment() {
  const queryClient = useQueryClient();

  return useMutation<MembershipStatus, Error, ConfirmInput>({
    mutationFn: confirmMembershipPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIP_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
