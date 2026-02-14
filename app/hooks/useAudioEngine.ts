import { useCallback, useEffect, useRef, useState } from "react";

import {
  AUDIO_CONFIG,
  createAudioContext,
  createDrumSound,
} from "~/utils/audio";

/** Audio engine state. */
interface AudioEngineState {
  context: AudioContext | null;
  isInitialized: boolean;
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
}

/** Audio engine hook with lookahead scheduler for precise web audio timing. */
export function useAudioEngine() {
  const [state, setState] = useState<AudioEngineState>({
    context: null,
    isInitialized: false,
    isPlaying: false,
    currentStep: 0,
    bpm: AUDIO_CONFIG.DEFAULT_BPM,
  });
  const ctxRef = useRef<AudioContext | null>(null);
  const nextRef = useRef(0),
    stepRef = useRef(0),
    timerRef = useRef<number | null>(null);
  const bufRef = useRef<Map<string, AudioBuffer>>(new Map());
  const cbRef = useRef<((n: number) => void) | null>(null);
  const schedRef = useRef<() => void>(() => {});

  /** Initialize Web Audio context (must be called after user gesture). */
  const init = useCallback(async () => {
    if (ctxRef.current) return;
    const ctx = createAudioContext();
    await ctx.resume();
    ctxRef.current = ctx;
    setState((p) => ({ ...p, context: ctx, isInitialized: true }));
  }, []);

  /** Load an audio file and decode it into a buffer. */
  const loadSample = useCallback(async (name: string, url: string) => {
    if (!ctxRef.current) return;
    try {
      const res = await fetch(url);
      bufRef.current.set(
        name,
        await ctxRef.current.decodeAudioData(await res.arrayBuffer()),
      );
    } catch (e) {
      console.error(`Failed to load sample ${name}:`, e);
    }
  }, []);

  /** Play a previously loaded sample. */
  const playSample = useCallback((name: string, v = 1) => {
    if (!ctxRef.current) return;
    const buf = bufRef.current.get(name);
    if (!buf) return;
    const src = ctxRef.current.createBufferSource();
    const gain = ctxRef.current.createGain();
    src.buffer = buf;
    gain.gain.value = v;
    src.connect(gain).connect(ctxRef.current.destination);
    src.start();
  }, []);

  /** Play a synthesized tone with envelope for percussive sounds. */
  const playTone = useCallback((freq: number, dur: number, v = 1) => {
    if (!ctxRef.current) return;
    createDrumSound(ctxRef.current, freq, dur, v);
  }, []);

  /** Called by scheduler to notify about the current step. */
  const scheduleNote = useCallback((step: number) => {
    if (cbRef.current) cbRef.current(step);
  }, []);

  /** Lookahead scheduler - runs frequently to schedule notes in advance for precise timing. */
  const runScheduler = useCallback(() => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    while (
      nextRef.current <
      ctx.currentTime + AUDIO_CONFIG.SCHEDULE_AHEAD_TIME
    ) {
      scheduleNote(stepRef.current);
      nextRef.current += 60 / state.bpm / 4;
      stepRef.current = (stepRef.current + 1) % 16;
    }
    timerRef.current = window.setTimeout(
      schedRef.current,
      AUDIO_CONFIG.LOOKAHEAD,
    );
  }, [state.bpm, scheduleNote]);

  useEffect(() => {
    schedRef.current = runScheduler;
  }, [runScheduler]);

  /** Start playback. */
  const start = useCallback(() => {
    if (!ctxRef.current || state.isPlaying) return;
    nextRef.current = ctxRef.current.currentTime;
    setState((p) => ({ ...p, isPlaying: true }));
    runScheduler();
  }, [state.isPlaying, runScheduler]);

  /** Stop playback and reset to step 0 */
  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stepRef.current = 0;
    setState((p) => ({ ...p, isPlaying: false, currentStep: 0 }));
  }, []);

  /** Pause playback without resetting position */
  const pause = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState((p) => ({ ...p, isPlaying: false }));
  }, []);

  /** Update BPM, clamped to valid range */
  const setBpm = useCallback((bpm: number) => {
    setState((p) => ({
      ...p,
      bpm: Math.max(AUDIO_CONFIG.MIN_BPM, Math.min(AUDIO_CONFIG.MAX_BPM, bpm)),
    }));
  }, []);

  /** Register callback to be called on each step */
  const setOnStepCallback = useCallback((fn: (n: number) => void) => {
    cbRef.current = fn;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ctxRef.current?.close();
    };
  }, []);

  return {
    ...state,
    init,
    loadSample,
    playSample,
    playTone,
    start,
    stop,
    pause,
    setBpm,
    setOnStepCallback,
  };
}
