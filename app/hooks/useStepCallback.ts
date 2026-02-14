import { useEffect } from "react";

import type { Instrument } from "~/types";

const FREQUENCIES: Record<string, number> = {
  kick: 60,
  snare: 200,
  hihat: 800,
  clap: 150,
};

const DURATIONS: Record<string, number> = {
  kick: 0.5,
  snare: 0.3,
  hihat: 0.1,
  clap: 0.2,
};

interface UseStepCallbackOptions {
  audio: {
    setOnStepCallback: (fn: (step: number) => void) => void;
    playTone: (freq: number, dur: number, vel: number) => void;
  };
  sequencer: {
    setCurrentStep: (step: number) => void;
    getActiveNotesForStep: (
      step: number,
    ) => { instrument: Instrument; velocity: number }[];
  };
}

export function useStepCallback({ audio, sequencer }: UseStepCallbackOptions) {
  useEffect(() => {
    audio.setOnStepCallback((step) => {
      sequencer.setCurrentStep(step);

      const activeNotes = sequencer.getActiveNotesForStep(step);
      activeNotes.forEach(({ instrument, velocity }) => {
        const freq = FREQUENCIES[instrument.id] || 440;
        const duration = DURATIONS[instrument.id] || 0.1;
        audio.playTone(freq, duration, velocity);
      });
    });
  }, [audio, sequencer]);
}
