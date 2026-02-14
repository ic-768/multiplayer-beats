import { useEffect, useRef } from "react";

import { useSequencerStore } from "~/store/sequencer";
import type { Instrument } from "~/types";
import { AUDIO_CONFIG, DRUM_SAMPLES } from "~/utils/audio";

interface UseAudioSequencerOptions {
  instruments: Instrument[];
  steps?: number;
}

/**
 * Combined audio engine and sequencer hook using Zustand.
 * Store handles state, audio engine handles Web Audio scheduling.
 */
export const useAudioSequencer = ({
  instruments: _instruments,
  steps: _steps = 16,
}: UseAudioSequencerOptions) => {
  // Audio engine refs
  const ctx = useRef<AudioContext | null>(null);
  const next = useRef(0);
  const step = useRef(0);
  const timer = useRef<number | null>(null);
  const buf = useRef<Map<string, AudioBuffer>>(new Map());
  const sched = useRef<() => void>(() => {});
  const onStepRef = useRef<((step: number) => void) | null>(null);

  // Fetch and decode an audio file into a reusable AudioBuffer
  const loadSample = async (name: string, url: string) => {
    if (!ctx.current) return;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed to fetch sample ${name}: ${res.status}`);
        return;
      }
      const audioData = await res.arrayBuffer();
      const buffer = await ctx.current.decodeAudioData(audioData);
      buf.current.set(name, buffer);
      console.log(`Loaded sample: ${name}`);
    } catch (e) {
      console.error(`Failed to load sample ${name}:`, e);
    }
  };

  // Initialize the AudioContext
  const init = async () => {
    if (ctx.current) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx.current = new Ctor();
    await ctx.current.resume();

    await Promise.all([
      loadSample("kick", DRUM_SAMPLES.kick),
      loadSample("snare", DRUM_SAMPLES.snare),
      loadSample("hihat", DRUM_SAMPLES.hihat),
      loadSample("clap", DRUM_SAMPLES.clap),
    ]);
  };

  // Play a pre-loaded sample buffer
  const playSampleAt = (name: string, time: number, v = 1) => {
    if (!ctx.current) return;
    const b = buf.current.get(name);
    if (!b) return;
    const src = ctx.current.createBufferSource();
    const gain = ctx.current.createGain();
    src.buffer = b;
    gain.gain.value = v;
    src.connect(gain).connect(ctx.current.destination);
    src.start(time);
  };

  // Synthesize a sawtooth tone
  const playToneAt = (freq: number, dur: number, time: number, v = 1) => {
    if (!ctx.current) return;
    const c = ctx.current;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.frequency.value = freq;
    osc.type = "sawtooth";
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(v * 0.3, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(time);
    osc.stop(time + dur);
  };

  // Lookahead scheduler - reads directly from store
  const schedule = () => {
    if (!ctx.current) return;
    const c = ctx.current;
    const state = useSequencerStore.getState();

    const getNotes = (stepIndex: number) =>
      state.steps
        .map((instrumentSteps, index) => ({
          instrument: state.instruments[index],
          step: instrumentSteps[stepIndex],
          index,
        }))
        .filter(({ step }) => step.active)
        .map(({ instrument, step, index }) => ({
          instrument,
          velocity: step.velocity,
          index,
        }));

    while (next.current < c.currentTime + AUDIO_CONFIG.SCHEDULE_AHEAD_TIME) {
      const currentStepVal = step.current;
      if (onStepRef.current) onStepRef.current(currentStepVal);
      getNotes(currentStepVal).forEach(({ instrument, velocity }) => {
        if (buf.current.has(instrument.id)) {
          playSampleAt(instrument.id, next.current, velocity);
        }
      });
      next.current += 60 / state.bpm / 4;
      step.current = (step.current + 1) % 16;
    }
    timer.current = window.setTimeout(sched.current, AUDIO_CONFIG.LOOKAHEAD);
  };

  // Start playback
  const start = () => {
    const { isPlaying } = useSequencerStore.getState();
    if (!ctx.current || isPlaying) return;
    next.current = ctx.current.currentTime;
    useSequencerStore.setState({ isPlaying: true });
    sched.current = () => schedule();
    sched.current();
  };

  // Stop playback
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    step.current = 0;
    useSequencerStore.setState({ isPlaying: false, currentStep: 0 });
  };

  // Pause playback
  const pause = () => {
    if (timer.current) clearTimeout(timer.current);
    useSequencerStore.setState({ isPlaying: false });
  };

  // Update BPM
  const setBpm = (bpm: number) => {
    useSequencerStore.getState().setBpm(bpm);
  };

  const setCurrentStep = (step: number) => {
    useSequencerStore.getState().setCurrentStep(step);
  };

  const setOnStep = (fn: (step: number) => void) => {
    onStepRef.current = fn;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      ctx.current?.close();
    };
  }, []);

  return {
    init,
    loadSample,
    playSampleAt,
    playToneAt,
    start,
    stop,
    pause,
    setBpm,
    setOnStep,
    setCurrentStep,
  };
};
