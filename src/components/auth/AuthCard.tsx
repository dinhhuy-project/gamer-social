import type { ReactNode } from "react";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {title}
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}