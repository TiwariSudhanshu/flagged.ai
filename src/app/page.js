import Chat from "@/components/Chat";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-stretch justify-start bg-zinc-50 dark:bg-black">
      <main className="flex-1 w-full">
        <Chat />
      </main>
      <footer className="text-center text-xs text-zinc-500 py-6 px-4">
        Built for the agentic AI hackathon. One-tap forward, 30-second verdict.
      </footer>
    </div>
  );
}
