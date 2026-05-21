import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="h-screen py-6 px-4 sidebar-shell">
      <div className="px-3">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-orange-600 to-yellow-400 flex items-center justify-center font-bold text-black">S</div>
          <div className="text-white font-semibold">SOCIARA</div>
        </div>

        <nav className="space-y-2">
          <Link href="#" className="flex items-center gap-3 p-3 rounded-md bg-gradient-to-r from-orange-600/30 to-transparent text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
            </svg>
            <span className="font-medium">Home Page</span>
          </Link>

          <Link href="#" className="flex items-center gap-3 p-3 rounded-md text-zinc-300 hover:bg-zinc-800/60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5v14l7-5 7 5V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
            </svg>
            <span>Saved Post</span>
          </Link>

          <Link href="#" className="flex items-center gap-3 p-3 rounded-md text-zinc-300 hover:bg-zinc-800/60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9h14l-2-9M10 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span>Market Place</span>
          </Link>

          <Link href="#" className="flex items-center gap-3 p-3 rounded-md text-zinc-300 hover:bg-zinc-800/60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span>Messenger</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
