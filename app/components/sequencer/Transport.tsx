interface TransportProps {
  isPlaying: boolean;
  bpm: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onClear: () => void;
}

export function Transport({
  isPlaying,
  bpm,
  onPlay,
  onPause,
  onStop,
  onBpmChange,
  onClear,
}: TransportProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-gray-800 p-4">
      <div className="flex gap-2">
        {!isPlaying ? (
          <button
            onClick={onPlay}
            className="rounded bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-500 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
          >
            Play
          </button>
        ) : (
          <button
            onClick={onPause}
            className="rounded bg-yellow-600 px-4 py-2 font-medium text-white transition-colors hover:bg-yellow-500 focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
          >
            Pause
          </button>
        )}
        <button
          onClick={onStop}
          className="rounded bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
        >
          Stop
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="bpm" className="text-sm text-gray-400">
          BPM
        </label>
        <input
          id="bpm"
          type="number"
          min={60}
          max={180}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-16 rounded bg-gray-700 px-2 py-1 text-center text-white"
        />
      </div>

      <button
        onClick={onClear}
        className="ml-auto rounded bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-500 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
      >
        Clear
      </button>
    </div>
  );
}
