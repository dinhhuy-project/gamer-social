import ConversationList from "@/components/chat/ConversationList";

export default function MessagesIndexPage() {
  return (
    <div className="h-[calc(100vh-80px)] flex bg-black">
      <aside className="w-80 border-r border-zinc-800 bg-zinc-950">
        <div className="p-3 text-white font-semibold">Messages</div>
        <ConversationList />
      </aside>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-zinc-500">Select a conversation to start chatting</div>
      </main>
    </div>
  );
}
