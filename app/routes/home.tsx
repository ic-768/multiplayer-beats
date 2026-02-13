import { CreateRoomForm } from "~/components/multiplayer/CreateRoomForm";
import { JoinRoomForm } from "~/components/multiplayer/JoinRoomForm";

export function meta() {
  return [
    { title: "Multiplayer Beats - Collaborative Beat Maker" },
    {
      name: "description",
      content:
        "Create beats together in real-time. Take turns, collaborate, and make music with friends.",
    },
  ];
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-5xl font-bold text-white">Multiplayer Beats</h1>
          <p className="text-xl text-gray-400">
            Create beats together, one turn at a time
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <CreateRoomForm />
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <JoinRoomForm />
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>How it works:</p>
          <p className="mt-1">
            Two players take 60-second turns adding to a shared beat grid. Build
            your track round by round!
          </p>
        </div>
      </div>
    </div>
  );
}
