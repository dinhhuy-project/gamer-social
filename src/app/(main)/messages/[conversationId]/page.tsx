import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <div className="h-[calc(100vh-80px)] flex bg-black">
      <aside className="w-80 border-r border-zinc-800 bg-zinc-950">
        <div className="p-3 text-white font-semibold">
          Messages
        </div>

        <ConversationList />
      </aside>

      <main className="flex-1">
        <ChatWindow conversationId={conversationId} />
      </main>
    </div>
  );
}