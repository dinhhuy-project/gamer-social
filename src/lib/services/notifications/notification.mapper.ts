import type { NotificationDto } from "@/types/notification.types";

export function mapNotificationRecordToDto(row: any): NotificationDto {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title ?? null,
    body: row.body ?? null,
    data: row.data ?? undefined,
    createdAt: row.created_at ? (row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)) : null,
    isRead: Boolean(row.is_read),
  };
}
