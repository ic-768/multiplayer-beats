import type { Step } from "~/types";

interface StepProps {
  step: Step;
  isCurrentStep: boolean;
  instrumentColor: string;
  onClick: () => void;
}

export function StepComponent({
  step,
  isCurrentStep,
  instrumentColor,
  onClick,
}: StepProps) {
  return (
    <button
      onClick={onClick}
      className={`relative h-10 w-10 rounded transition-colors duration-75 sm:h-12 sm:w-12 ${step.active ? "" : "bg-gray-800 hover:bg-gray-700"} ${isCurrentStep ? "ring-2 ring-white" : ""} ${!step.active && isCurrentStep ? "bg-gray-700" : ""} `}
      style={{
        backgroundColor: step.active ? instrumentColor : undefined,
        opacity: step.active ? 0.4 + step.velocity * 0.6 : 1,
      }}
      aria-label={step.active ? "Active step" : "Inactive step"}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    />
  );
}
