// src/components/reaction/ReactionPicker.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { REACTION_OPTIONS } from "./reactionConstants";
import { cn } from "@/lib/utils/cn";
import type { ReactionType } from "@/types/api.types";

type ReactionPickerProps = {
  currentReaction: ReactionType | null;
  onSelect: (type: ReactionType) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

export function ReactionPicker({
  currentReaction,
  onSelect,
  open = false,
  onOpenChange,
  children,
}: ReactionPickerProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={2}
        onMouseEnter={() => onOpenChange?.(true)}
        onMouseLeave={() => onOpenChange?.(false)}
      >
        <div className="flex items-center gap-1.5">
          {REACTION_OPTIONS.map((reaction) => (
            <Button
              key={reaction.type}
              type="button"
              variant={currentReaction === reaction.type ? "secondary" : "ghost"}
              size="icon"
              aria-label={reaction.label}
              title={reaction.label}
              onClick={() => onSelect(reaction.type)}
              className={cn(
                "size-10 rounded-full text-lg transition-transform hover:scale-110",
                currentReaction === reaction.type && "bg-accent"
              )}
            >
              {reaction.emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
