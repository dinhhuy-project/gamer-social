import { LogoutButton } from "@/components/auth/LogoutButton";

export function Topbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-16 w-full lg:left-72 lg:w-[calc(100%-18rem)] flex items-center justify-between px-6 border-b border-zinc-800 bg-transparent backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-md hover:bg-zinc-800/40">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden sm:block text-lg font-bold text-white">SOCIARA</div>
      </div>

      <div className="flex-1 px-6">
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <input
              placeholder="Search for games, players, posts..."
              className="w-full rounded-full px-4 py-2 bg-zinc-900/50 placeholder-zinc-400 text-white border border-zinc-800"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full bg-zinc-900/40 hover:bg-zinc-800/40">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
          </svg>
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-orange-500 text-black">3</span>
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-yellow-400 flex items-center justify-center text-black font-bold">U</div>

        <LogoutButton />
      </div>
    </div>
  );
}