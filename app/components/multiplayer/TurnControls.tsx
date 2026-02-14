interface TurnControlsProps {
  isActive: boolean;
  onStart: () => void;
  onEnd: () => void;
  onReset: () => void;
}

export function TurnControls({
  isActive,
  onStart,
  onEnd,
  onReset,
}: TurnControlsProps) {
  return (
    <div className="flex gap-4">
      {!isActive ? (
        <button
          onClick={onStart}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-500"
        >
          Start Turn
        </button>
      ) : (
        <button
          onClick={onEnd}
          className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-500"
        >
          End Turn Early
        </button>
      )}
      <button
        onClick={onReset}
        className="rounded-lg bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-500"
      >
        Reset Game
      </button>
    </div>
  );
}
