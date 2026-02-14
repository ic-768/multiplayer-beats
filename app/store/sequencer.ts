import { create } from "zustand";

import type { Instrument, Step } from "~/types";
import { DEFAULT_INSTRUMENTS } from "~/types";

interface SequencerStore {
  steps: Step[][];
  currentStep: number;
  isPlaying: boolean;
  bpm: number;
  instruments: Instrument[];
  totalSteps: number;
  setSteps: (steps: Step[][]) => void;
  setCurrentStep: (step: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setBpm: (bpm: number) => void;
  editStep: (
    instrumentIndex: number,
    stepIndex: number,
    updater: (step: Step) => Step,
  ) => void;
  toggleStep: (instrumentIndex: number, stepIndex: number) => void;
  setStepVelocity: (
    instrumentIndex: number,
    stepIndex: number,
    velocity: number,
  ) => void;
  clearPattern: () => void;
}

const createInitialSteps = (
  instruments: Instrument[],
  steps: number,
): Step[][] => {
  return instruments.map(() =>
    Array.from({ length: steps }, () => ({ active: false, velocity: 0.8 })),
  );
};

export const useSequencerStore = create<SequencerStore>((set) => ({
  steps: createInitialSteps(DEFAULT_INSTRUMENTS, 16),
  currentStep: 0,
  isPlaying: false,
  bpm: 120,
  instruments: DEFAULT_INSTRUMENTS,
  totalSteps: 16,

  setSteps: (steps) => set({ steps }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setBpm: (bpm) => set({ bpm: Math.max(60, Math.min(180, bpm)) }),

  editStep: (instrumentIndex, stepIndex, updater) =>
    set((state) => ({
      steps: state.steps.map((instrumentSteps, i) =>
        i === instrumentIndex
          ? instrumentSteps.map((step, j) =>
              j === stepIndex ? updater(step) : step,
            )
          : instrumentSteps,
      ),
    })),

  toggleStep: (instrumentIndex, stepIndex) =>
    set((state) => ({
      steps: state.steps.map((instrumentSteps, i) =>
        i === instrumentIndex
          ? instrumentSteps.map((step, j) =>
              j === stepIndex ? { ...step, active: !step.active } : step,
            )
          : instrumentSteps,
      ),
    })),

  setStepVelocity: (instrumentIndex, stepIndex, velocity) =>
    set((state) => ({
      steps: state.steps.map((instrumentSteps, i) =>
        i === instrumentIndex
          ? instrumentSteps.map((step, j) =>
              j === stepIndex
                ? { ...step, velocity: Math.max(0, Math.min(1, velocity)) }
                : step,
            )
          : instrumentSteps,
      ),
    })),

  clearPattern: () =>
    set((state) => ({
      steps: createInitialSteps(state.instruments, state.totalSteps),
    })),
}));
