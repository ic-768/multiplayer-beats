import { useCallback, useEffect, useRef, useState } from "react";

import { AUDIO_CONFIG, DRUM_SAMPLES, DRUM_SOUNDS } from "~/utils/audio";

type Note = { instrument: { id: string }; velocity: number };
type NotesFn = (s: number) => Note[];
interface AudioEngineState {
  context: AudioContext | null;
  isInitialized: boolean;
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
}

/**
 * Core audio engine hook that manages Web Audio API playback for the beat sequencer.
 * Handles audio context initialization, sample loading, tone synthesis,
 * and a lookahead scheduler for precise, glitch-free step sequencing.
 */
export function useAudioEngine() {
  // Reactive state exposed to consumers
  const [state, setState] = useState<AudioEngineState>({
    context: null,
    isInitialized: false,
    isPlaying: false,
    currentStep: 0,
    bpm: AUDIO_CONFIG.DEFAULT_BPM,
  });

  // Refs for values that must persist across renders without triggering re-renders
  const ctx = useRef<AudioContext>(null); // Web Audio context
  const next = useRef(0), // Scheduled time (in seconds) of the next step
    step = useRef(0), // Current step index in the sequence (0–15)
    timer = useRef<number>(null); // setTimeout handle for the scheduler loop
  const buf = useRef<Map<string, AudioBuffer>>(new Map()); // Loaded audio sample buffers keyed by name
  const sched = useRef<() => void>(() => {}); // Mutable ref to the scheduler closure (avoids stale closures)
  const onStepRef = useRef<((step: number) => void) | null>(null); // External callback invoked on each step (e.g. UI highlight)
  const getNotesRef = useRef<NotesFn | null>(null); // Function that returns active notes for a given step

  // Register a callback that provides notes for each step
  const setNotesCallback = useCallback((fn: NotesFn) => {
    getNotesRef.current = fn;
  }, []);

  // Register a callback that fires on every sequencer step (used for UI sync)
  const setOnStep = useCallback((fn: (step: number) => void) => {
    onStepRef.current = fn;
  }, []);

  // Fetch and decode an audio file into a reusable AudioBuffer
  const loadSample = useCallback(async (name: string, url: string) => {
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
  }, []);

  // Initialize the AudioContext (handles Safari's webkitAudioContext prefix).
  // Must be called from a user gesture to satisfy browser autoplay policies.
  const init = useCallback(async () => {
    if (ctx.current) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx.current = new Ctor();
    await ctx.current.resume();

    // Load drum samples
    await Promise.all([
      loadSample("kick", DRUM_SAMPLES.kick),
      loadSample("snare", DRUM_SAMPLES.snare),
      loadSample("hihat", DRUM_SAMPLES.hihat),
      loadSample("clap", DRUM_SAMPLES.clap),
    ]);

    setState((p) => ({ ...p, context: ctx.current, isInitialized: true }));
  }, [loadSample]);

  // Play a pre-loaded sample buffer at a precise Web Audio time with optional velocity
  const playSampleAt = useCallback((name: string, time: number, v = 1) => {
    if (!ctx.current) return;
    const b = buf.current.get(name);
    if (!b) return;
    const src = ctx.current.createBufferSource();
    const gain = ctx.current.createGain();
    src.buffer = b;
    gain.gain.value = v;
    src.connect(gain).connect(ctx.current.destination);
    src.start(time);
  }, []);

  // Synthesize a sawtooth tone with an attack-decay envelope at a precise time.
  // Used as a fallback when no sample is loaded for an instrument.
  const playToneAt = useCallback(
    (freq: number, dur: number, time: number, v = 1) => {
      if (!ctx.current) return;
      const c = ctx.current;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.frequency.value = freq;
      osc.type = "sawtooth";
      // Quick attack ramp to avoid clicks
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(v * 0.3, time + 0.01);
      // Exponential decay for a percussive feel
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(time);
      osc.stop(time + dur);
    },
    [],
  );

  // Lookahead scheduler: schedules all notes within the lookahead window,
  // then sets a timeout to call itself again. This two-tier approach
  // (setTimeout for wake-up + Web Audio scheduling for precision) ensures
  // tight timing without blocking the main thread.
  const schedule = useCallback(
    (getNotes: NotesFn) => {
      if (!ctx.current) return;
      const c = ctx.current;
      // Schedule all steps that fall within the lookahead window
      while (next.current < c.currentTime + AUDIO_CONFIG.SCHEDULE_AHEAD_TIME) {
        const currentStepVal = step.current;
        if (onStepRef.current) onStepRef.current(currentStepVal);
        // Trigger a sound for each active note at this step
        getNotes(currentStepVal).forEach(({ instrument, velocity }) => {
          // Try to play sample first, fall back to synthesized drum
          if (buf.current.has(instrument.id)) {
            playSampleAt(instrument.id, next.current, velocity);
          } else {
            const s = DRUM_SOUNDS[instrument.id] || {
              frequency: 440,
              duration: 0.1,
            };
            playToneAt(s.frequency, s.duration, next.current, velocity);
          }
        });
        // Advance to the next sixteenth-note
        next.current += 60 / state.bpm / 4;
        step.current = (step.current + 1) % 16;
      }
      // Re-invoke the scheduler after a short delay
      timer.current = window.setTimeout(sched.current, AUDIO_CONFIG.LOOKAHEAD);
    },
    [state.bpm, playToneAt, playSampleAt],
  );

  // Start playback from the current audio time, kicking off the scheduler loop
  const start = useCallback(
    (getNotes: NotesFn) => {
      if (!ctx.current || state.isPlaying) return;
      getNotesRef.current = getNotes;
      next.current = ctx.current.currentTime;
      setState((p) => ({ ...p, isPlaying: true }));
      // Wrap schedule in a ref so the timeout always calls the latest version
      sched.current = () => {
        if (getNotesRef.current) schedule(getNotesRef.current);
      };
      sched.current();
    },
    [state.isPlaying, schedule],
  );

  // Stop playback and reset the step counter to the beginning
  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    step.current = 0;
    setState((p) => ({ ...p, isPlaying: false, currentStep: 0 }));
  }, []);

  // Pause playback without resetting the step position
  const pause = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setState((p) => ({ ...p, isPlaying: false }));
  }, []);

  // Update BPM, clamped to the configured min/max range
  const setBpm = useCallback((bpm: number) => {
    setState((p) => ({
      ...p,
      bpm: Math.max(AUDIO_CONFIG.MIN_BPM, Math.min(AUDIO_CONFIG.MAX_BPM, bpm)),
    }));
  }, []);

  // Cleanup: cancel any pending scheduler timeout and close the audio context on unmount
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      ctx.current?.close();
    };
  }, []);

  return {
    ...state,
    init,
    loadSample,
    playSampleAt,
    playToneAt,
    start,
    stop,
    pause,
    setBpm,
    setOnStep,
    setNotesCallback,
  };
}
