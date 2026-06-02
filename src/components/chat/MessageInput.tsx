"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onSend: (content: string) => Promise<void> | void;
  isSending?: boolean;
};

export function MessageInput({ onSend, isSending }: Props) {
  const [value, setValue] = useState("");

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue("");
    try {
      await onSend(trimmed);
    } catch (err) {
      // swallow - UI can show toast later
      console.error(err);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 p-3">
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write a message..." className="flex-1" />
      <Button type="submit" disabled={isSending || value.trim() === ""}>Send</Button>
    </form>
  );
}

export default MessageInput;
