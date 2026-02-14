import type { Instrument, Step } from "~/types";

export const createInitialSteps = (
  instruments: Instrument[],
  steps: number,
): Step[][] => {
  return instruments.map(() =>
    Array.from({ length: steps }, () => ({ active: false, velocity: 0.8 })),
  );
};
