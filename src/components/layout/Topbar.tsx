import { LogoutButton } from "@/components/auth/LogoutButton";

export function Topbar() {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
      <h1 className="text-lg font-bold text-white">
        Gamer Social
      </h1>

      <LogoutButton />
    </div>
  );
}