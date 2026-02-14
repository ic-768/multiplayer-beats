import { useCallback, useState } from "react";

import type { Instrument, SequencerState, Step } from "~/types";

/** Configuration options for the sequencer hook. */
interface UseSequencerOptions {
  instruments: Instrument[];
  steps?: number;
}

/** Creates an empty step matrix for the given instruments and step count. */
const createInitialSteps = (
  instruments: Instrument[],
  steps: number,
): Step[][] => {
  return instruments.map(() =>
    Array.from({ length: steps }, () => ({ active: false, velocity: 0.8 })),
  );
};

/** Sequencer state management hook. Handles grid data, playback position, and tempo. */
export function useSequencer({ instruments, steps = 16 }: UseSequencerOptions) {
  const [state, setState] = useState<SequencerState>({
    steps: createInitialSteps(instruments, steps),
    currentStep: 0,
    isPlaying: false,
    bpm: 120,
  });

  /** Update a specific step. */
  const editStep = useCallback(
    (
      instrumentIndex: number,
      stepIndex: number,
      updater: (step: Step) => Step,
    ) => {
      setState((prev) => {
        const newSteps = prev.steps.map((instrumentSteps, i) =>
          i === instrumentIndex
            ? instrumentSteps.map((step, j) =>
                j === stepIndex ? updater(step) : step,
              )
            : instrumentSteps,
        );
        return { ...prev, steps: newSteps };
      });
    },
    [],
  );

  /** Toggle a step on/off. */
  const toggleStep = useCallback(
    (instrumentIndex: number, stepIndex: number) => {
      editStep(instrumentIndex, stepIndex, (step) => ({
        ...step,
        active: !step.active,
      }));
    },
    [editStep],
  );

  /** Set the velocity (volume) of a specific step. */
  const setStepVelocity = useCallback(
    (instrumentIndex: number, stepIndex: number, velocity: number) => {
      editStep(instrumentIndex, stepIndex, (step) => ({
        ...step,
        velocity: Math.max(0, Math.min(1, velocity)),
      }));
    },
    [editStep],
  );

  /** Clear all steps - reset the entire pattern to empty. */
  const clearPattern = useCallback(() => {
    setState((prev) => ({
      ...prev,
      steps: createInitialSteps(instruments, steps),
    }));
  }, [instruments, steps]);

  /** Update the current playback position (called by audio engine). */
  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  /** Update playing state */
  const setIsPlaying = useCallback((isPlaying: boolean) => {
    setState((prev) => ({ ...prev, isPlaying }));
  }, []);

  /** Update BPM (beats per minute) */
  const setBpm = useCallback((bpm: number) => {
    setState((prev) => ({ ...prev, bpm: Math.max(60, Math.min(180, bpm)) }));
  }, []);

  /** Get all active notes for a given step position. Used by audio engine. */
  const getActiveNotesForStep = useCallback(
    (
      stepIndex: number,
    ): { instrument: Instrument; velocity: number; index: number }[] => {
      return state.steps
        .map((instrumentSteps, index) => ({
          instrument: instruments[index],
          step: instrumentSteps[stepIndex],
          index,
        }))
        .filter(({ step }) => step.active)
        .map(({ instrument, step, index }) => ({
          instrument,
          velocity: step.velocity,
          index,
        }));
    },
    [state.steps, instruments],
  );

  return {
    ...state,
    instruments,
    totalSteps: steps,
    toggleStep,
    setStepVelocity,
    clearPattern,
    setCurrentStep,
    setIsPlaying,
    setBpm,
    getActiveNotesForStep,
  };
}
