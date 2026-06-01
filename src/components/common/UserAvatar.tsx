// ── Avatar fallback initials ─────────────────────────────────
export function AvatarFallback({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = name.charCodeAt(0) * 7 % 360;

  return (
    <div
      className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
      style={{ background: `hsl(${hue}, 55%, 35%)` }}
    >
      {initials}
    </div>
  );
}