// Auto-generate bằng lệnh:
// npx supabase gen types typescript --project-id [ref] > src/types/database.types.ts
export type Database = {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
};
