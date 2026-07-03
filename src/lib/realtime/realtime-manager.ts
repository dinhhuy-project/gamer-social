import type { SupabaseClient } from "@supabase/supabase-js";

type Entry = { supabase: SupabaseClient; channel: any; persistent: boolean };

class RealtimeManager {
  private entries = new Set<Entry>();

  register(supabase: SupabaseClient, channel: any, persistent = false) {
    this.entries.add({ supabase, channel, persistent });
  }

  unregister(supabase: SupabaseClient, channel: any) {
    for (const e of Array.from(this.entries)) {
      if (e.supabase === supabase && e.channel === channel) {
        this.entries.delete(e);
        break;
      }
    }
  }

  cleanup() {
    for (const e of Array.from(this.entries)) {
      if (e.persistent) continue;
      try {
        e.supabase.removeChannel(e.channel);
      } catch (err) {
        // ignore
      }
      this.entries.delete(e);
    }
  }

  cleanupAll() {
    for (const e of Array.from(this.entries)) {
      try {
        e.supabase.removeChannel(e.channel);
      } catch (err) {
        // ignore
      }
      this.entries.delete(e);
    }
  }

  count() {
    return this.entries.size;
  }
}

export const realtimeManager = new RealtimeManager();

export default realtimeManager;
