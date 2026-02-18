import { PIANO_NOTES } from "~/types";

interface PianoRollProps {
  pianoSteps: Map<number, Set<number>>;
  currentStep: number;
  onToggleNote: (stepIndex: number, noteIndex: number) => void;
  disabled?: boolean;
}

const NOTE_COLORS = [
  "#ef4444",
  "#ef4444",
  "#3b82f6",
  "#3b82f6",
  "#3b82f6",
  "#22c55e",
  "#22c55e",
  "#22c55e",
  "#22c55e",
  "#eab308",
  "#eab308",
  "#eab308",
  "#ef4444",
  "#ef4444",
  "#3b82f6",
  "#3b82f6",
  "#3b82f6",
  "#22c55e",
  "#22c55e",
  "#22c55e",
  "#22c55e",
  "#eab308",
  "#eab308",
  "#eab308",
];

const BLACK_KEYS = [1, 3, 6, 8, 10, 13, 15, 18, 20, 22];

export function PianoRoll({
  pianoSteps,
  currentStep,
  onToggleNote,
  disabled = false,
}: PianoRollProps) {
  const isBlackKey = (noteIndex: number) => BLACK_KEYS.includes(noteIndex);

  return (
    <div className="rounded-lg bg-gray-900 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Piano</h3>
      <div className="flex flex-col gap-0.5 overflow-x-auto">
        {[...PIANO_NOTES].reverse().map((note, noteIndex) => {
          const isBlack = isBlackKey(noteIndex);
          const color = NOTE_COLORS[noteIndex];

          return (
            <div key={note} className="flex items-center gap-1 sm:gap-2">
              <div
                className={`w-12 shrink-0 rounded px-1 text-xs font-medium text-white sm:w-16 sm:text-sm ${isBlack ? "bg-gray-800" : ""}`}
                style={{ backgroundColor: isBlack ? "#1f2937" : color }}
              >
                {note}
              </div>
              <div className="flex gap-0.5 sm:gap-1">
                {Array.from({ length: 16 }, (_, stepIndex) => {
                  const isActive = pianoSteps.get(stepIndex)?.has(noteIndex);
                  const isCurrent = currentStep === stepIndex;

                  return (
                    <button
                      key={stepIndex}
                      onClick={() =>
                        !disabled && onToggleNote(stepIndex, noteIndex)
                      }
                      disabled={disabled}
                      className={`h-6 w-4 shrink-0 rounded-sm border transition-colors sm:h-8 sm:w-6 ${
                        isActive
                          ? "border-transparent"
                          : isBlack
                            ? "border-gray-700 bg-gray-800 hover:bg-gray-700"
                            : "border-gray-600 bg-gray-700 hover:bg-gray-600"
                      } ${isCurrent ? "ring-2 ring-white ring-offset-1 ring-offset-gray-900" : ""}`}
                      style={{
                        backgroundColor: isActive ? color : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
