import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";

export const formatTimeAgo = (d: Date | string) =>
  formatDistanceToNow(new Date(d), { addSuffix: true, locale: vi });

export const formatDate = (d: Date | string) =>
  format(new Date(d), "dd/MM/yyyy", { locale: vi });

export const formatDateTime = (d: Date | string) =>
  format(new Date(d), "HH:mm dd/MM/yyyy", { locale: vi });

export const formatCurrency = (amount: number | string) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount));

export const formatNumber = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
      : n.toString();
