import { StepComponent } from "./Step";

import type { Instrument, Step } from "~/types";

interface InstrumentRowProps {
  instrument: Instrument;
  steps: Step[];
  currentStep: number;
  onToggleStep: (stepIndex: number) => void;
  disabled?: boolean;
}

export function InstrumentRow({
  instrument,
  steps,
  currentStep,
  onToggleStep,
  disabled = false,
}: InstrumentRowProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div
        className="w-20 truncate rounded px-2 py-1 text-xs font-medium text-white sm:w-24 sm:text-sm"
        style={{ backgroundColor: instrument.color }}
      >
        {instrument.name}
      </div>
      <div className="flex gap-0.5 sm:gap-1">
        {steps.map((step, index) => (
          <StepComponent
            key={index}
            step={step}
            isCurrentStep={currentStep === index}
            instrumentColor={instrument.color}
            onClick={() => onToggleStep(index)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
