import { useCallback, useState } from "react";

import type { Instrument, SequencerState, Step } from "~/types";

/**
 * Configuration options for the sequencer hook.
 */
interface UseSequencerOptions {
  /** List of instruments (determines number of rows) */
  instruments: Instrument[];
  /** Number of steps in the pattern (default 16) */
  steps?: number;
}

/**
 * Creates an empty step matrix for the given instruments and step count.
 */
const createInitialSteps = (
  instruments: Instrument[],
  steps: number,
): Step[][] => {
  return instruments.map(() =>
    Array.from({ length: steps }, () => ({ active: false, velocity: 0.8 })),
  );
};

/**
 * Sequencer state management hook.
 * Handles the grid data (which steps are active), playback position, and tempo.
 */
export function useSequencer({ instruments, steps = 16 }: UseSequencerOptions) {
  // Initialize state with empty steps
  const [state, setState] = useState<SequencerState>({
    steps: createInitialSteps(instruments, steps),
    currentStep: 0,
    isPlaying: false,
    bpm: 120,
  });

  /**
   * Toggle a step on/off.
   * @param instrumentIndex - Which instrument row (0-3)
   * @param stepIndex - Which step in the pattern (0-15)
   */
  const toggleStep = useCallback(
    (instrumentIndex: number, stepIndex: number) => {
      setState((prev) => {
        const newSteps = prev.steps.map((instrumentSteps, i) =>
          i === instrumentIndex
            ? instrumentSteps.map((step, j) =>
                j === stepIndex ? { ...step, active: !step.active } : step,
              )
            : instrumentSteps,
        );
        return { ...prev, steps: newSteps };
      });
    },
    [],
  );

  /**
   * Set the velocity (volume) of a specific step.
   * @param instrumentIndex - Which instrument row
   * @param stepIndex - Which step
   * @param velocity - Volume value (0-1)
   */
  const setStepVelocity = useCallback(
    (instrumentIndex: number, stepIndex: number, velocity: number) => {
      setState((prev) => {
        const newSteps = prev.steps.map((instrumentSteps, i) =>
          i === instrumentIndex
            ? instrumentSteps.map((step, j) =>
                j === stepIndex
                  ? { ...step, velocity: Math.max(0, Math.min(1, velocity)) }
                  : step,
              )
            : instrumentSteps,
        );
        return { ...prev, steps: newSteps };
      });
    },
    [],
  );

  /**
   * Clear all steps - reset the entire pattern to empty.
   */
  const clearPattern = useCallback(() => {
    setState((prev) => ({
      ...prev,
      steps: createInitialSteps(instruments, steps),
    }));
  }, [instruments, steps]);

  /**
   * Update the current playback position (called by audio engine).
   */
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

  /**
   * Get all active notes for a given step position.
   * Used by the audio engine to know what to play.
   * @param stepIndex - The step number to query
   * @returns Array of objects containing instrument, velocity, and instrument index
   */
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
