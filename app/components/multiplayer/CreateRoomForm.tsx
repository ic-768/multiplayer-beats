import { type SubmitEvent, useState } from "react";
import { useNavigate } from "react-router";

export function CreateRoomForm() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");

  const handleCreate = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    // Generate a simple room ID
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/room/${roomId}?player=${encodeURIComponent(playerName)}`);
  };

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <h2 className="text-xl font-bold text-white">Create New Room</h2>
      <div>
        <label
          htmlFor="create-name"
          className="mb-1 block text-sm text-gray-400"
        >
          Your Name
        </label>
        <input
          id="create-name"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="w-full rounded border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500"
      >
        Create Room
      </button>
    </form>
  );
}
