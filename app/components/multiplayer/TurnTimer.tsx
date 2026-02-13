interface TurnTimerProps {
  timeRemaining: number;
  currentPlayer: 1 | 2;
  isActive: boolean;
  round: number;
}

export function TurnTimer({
  timeRemaining,
  currentPlayer,
  isActive,
  round,
}: TurnTimerProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (!isActive) return "text-gray-500";
    if (timeRemaining <= 10) return "text-red-500 animate-pulse";
    if (timeRemaining <= 30) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="flex items-center gap-6 rounded-lg bg-gray-800 p-4">
      <div className="text-center">
        <div className="text-xs tracking-wider text-gray-400 uppercase">
          Round
        </div>
        <div className="text-2xl font-bold text-white">{round}</div>
      </div>

      <div className="h-10 w-px bg-gray-700" />

      <div className="text-center">
        <div className="text-xs tracking-wider text-gray-400 uppercase">
          Player Turn
        </div>
        <div
          className={`text-xl font-bold ${currentPlayer === 1 ? "text-blue-400" : "text-purple-400"}`}
        >
          Player {currentPlayer}
        </div>
      </div>

      <div className="h-10 w-px bg-gray-700" />

      <div className="text-center">
        <div className="text-xs tracking-wider text-gray-400 uppercase">
          Time Remaining
        </div>
        <div className={`font-mono text-3xl font-bold ${getTimerColor()}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>
    </div>
  );
}
