import { InstrumentRow } from "./InstrumentRow";

import type { Instrument, Step } from "~/types";

interface GridProps {
  instruments: Instrument[];
  steps: Step[][];
  currentStep: number;
  onToggleStep: (instrumentIndex: number, stepIndex: number) => void;
  disabled?: boolean;
}

export function Grid({
  instruments,
  steps,
  currentStep,
  onToggleStep,
  disabled = false,
}: GridProps) {
  return (
    <div className="flex flex-col gap-2 overflow-x-auto rounded-lg bg-gray-900 p-4">
      {instruments.map((instrument, instrumentIndex) => (
        <InstrumentRow
          key={instrument.id}
          instrument={instrument}
          steps={steps[instrumentIndex] || []}
          currentStep={currentStep}
          onToggleStep={(stepIndex) => onToggleStep(instrumentIndex, stepIndex)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
