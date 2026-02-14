import { type SubmitEvent, useState } from "react";
import { useNavigate } from "react-router";

export function JoinRoomForm() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleJoin = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!playerName.trim() || !roomId.trim()) return;

    navigate(
      `/room/${roomId.toUpperCase()}?player=${encodeURIComponent(playerName)}`,
    );
  };

  return (
    <form onSubmit={handleJoin} className="space-y-4">
      <h2 className="text-xl font-bold text-white">Join Room</h2>
      <div>
        <label htmlFor="join-name" className="mb-1 block text-sm text-gray-400">
          Your Name
        </label>
        <input
          id="join-name"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="w-full rounded border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label htmlFor="room-id" className="mb-1 block text-sm text-gray-400">
          Room Code
        </label>
        <input
          id="room-id"
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="Enter room code"
          className="w-full rounded border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full rounded bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-500"
      >
        Join Room
      </button>
    </form>
  );
}
