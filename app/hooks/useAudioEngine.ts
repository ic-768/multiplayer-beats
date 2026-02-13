import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Audio engine state exposed to consumers.
 * Tracks initialization, playback status, current step position, and tempo.
 */
interface AudioEngineState {
  /** The Web Audio API context - null until initialized */
  context: AudioContext | null;
  /** Whether init() has been called successfully */
  isInitialized: boolean;
  /** Whether the sequencer is currently playing */
  isPlaying: boolean;
  /** The current step position (0-15) during playback */
  currentStep: number;
  /** Beats per minute (affects playback speed) */
  bpm: number;
}

/**
 * Audio engine hook providing Web Audio API functionality for the sequencer.
 *
 * This implements a "lookahead scheduler" pattern - the gold standard for web audio timing.
 * Instead of using setInterval (which is imprecise), we:
 * 1. Run a timer frequently (every 25ms) via setTimeout
 * 2. Each run, schedule audio events slightly into the future (100ms)
 * 3. Use the Web Audio API's high-resolution clock for precise event timing
 *
 * This ensures rock-solid timing even when the main thread is busy.
 */
export function useAudioEngine() {
  // React state for UI - only use for things that need to trigger re-renders
  const [state, setState] = useState<AudioEngineState>({
    context: null,
    isInitialized: false,
    isPlaying: false,
    currentStep: 0,
    bpm: 120,
  });

  // =============================================================================
  // REFS - Mutable values that don't trigger re-renders
  // =============================================================================

  /** The Web Audio context - persists across renders but doesn't cause re-renders */
  const audioContextRef = useRef<AudioContext | null>(null);

  /** When the next note should play (in AudioContext time) */
  const nextNoteTimeRef = useRef<number>(0);

  /** Current step position in the 16-step sequence */
  const currentStepRef = useRef<number>(0);

  /** ID of the setTimeout used for the lookahead scheduler */
  const timerIDRef = useRef<number | null>(null);

  /** How often to run the scheduler (milliseconds) - lower = more responsive */
  const lookaheadRef = useRef<number>(25);

  /** How far ahead to schedule notes (seconds) - balances latency vs stability */
  const scheduleAheadTimeRef = useRef<number>(0.1);

  /** Loaded audio sample buffers (name -> AudioBuffer) */
  const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());

  /** Callback invoked on each step - used to trigger UI updates and play sounds */
  const onStepCallbackRef = useRef<((step: number) => void) | null>(null);

  /** Store scheduler function in a ref so it can call itself recursively */
  const schedulerRef = useRef<() => void>(() => {});

  /**
   * Initialize the Web Audio context.
   * Must be called after a user gesture (click/tap) - browsers block auto-playing audio.
   * Uses webkitAudioContext for Safari support.
   */
  const init = useCallback(async () => {
    if (audioContextRef.current) return;

    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
    // Resume in case the context was created in suspended state
    await ctx.resume();

    audioContextRef.current = ctx;
    setState((prev) => ({ ...prev, context: ctx, isInitialized: true }));
  }, []);

  /**
   * Load an audio file and decode it into a buffer.
   * @param name - Identifier to store the buffer under
   * @param url - URL to fetch the audio file from
   */
  const loadSample = useCallback(async (name: string, url: string) => {
    if (!audioContextRef.current) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer =
        await audioContextRef.current.decodeAudioData(arrayBuffer);
      buffersRef.current.set(name, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sample ${name}:`, error);
    }
  }, []);

  /**
   * Play a previously loaded sample.
   * @param name - Identifier of the sample to play
   * @param velocity - Volume (0-1), defaults to full volume
   */
  const playSample = useCallback((name: string, velocity: number = 1) => {
    if (!audioContextRef.current) return;

    const buffer = buffersRef.current.get(name);
    if (!buffer) return;

    // Create nodes: source -> gain -> destination
    const source = audioContextRef.current.createBufferSource();
    const gainNode = audioContextRef.current.createGain();

    source.buffer = buffer;
    gainNode.gain.value = velocity;

    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    source.start();
  }, []);

  /**
   * Play a synthesized tone (used for our drum sounds).
   * Uses an oscillator with an envelope (attack/decay) for a percussive sound.
   *
   * @param frequency - Hz (pitch) of the tone
   * @param duration - How long the sound lasts in seconds
   * @param velocity - Volume (0-1), defaults to 1
   */
  const playTone = useCallback(
    (frequency: number, duration: number, velocity: number = 1) => {
      if (!audioContextRef.current) return;

      const ctx = audioContextRef.current;

      // Oscillator generates the sound wave
      const oscillator = ctx.createOscillator();
      // Gain node controls volume envelope
      const gainNode = ctx.createGain();

      oscillator.frequency.value = frequency;
      oscillator.type = "sawtooth";

      // Envelope: quick attack, exponential decay
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now); // Start at silence
      gainNode.gain.linearRampToValueAtTime(velocity * 0.3, now + 0.01); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Decay to silence

      // Connect: oscillator -> gain -> speakers
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Start and stop
      oscillator.start(now);
      oscillator.stop(now + duration);
    },
    [],
  );

  /**
   * Called by the scheduler to notify about the current step.
   * Triggers the callback that handles UI updates and sound playback.
   */
  const scheduleNote = useCallback((step: number) => {
    if (onStepCallbackRef.current) {
      onStepCallbackRef.current(step);
    }
  }, []);

  /**
   * The lookahead scheduler - runs frequently to schedule notes in advance.
   *
   * This is the core of precise audio timing:
   * 1. Check if any notes need to be scheduled in the next 100ms
   * 2. For each note, calculate its exact audio time and schedule it
   * 3. Set up the next scheduler run in 25ms
   *
   * By scheduling well ahead but running frequently, we get both
   * precise timing and the ability to respond quickly to changes.
   */
  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;

    // Keep scheduling while there are notes within our scheduling window
    while (
      nextNoteTimeRef.current <
      ctx.currentTime + scheduleAheadTimeRef.current
    ) {
      // Notify the callback (updates UI, triggers sound playback)
      scheduleNote(currentStepRef.current);

      // Calculate timing for next 16th note
      // At 120 BPM: 1 beat = 0.5s, 1/4 beat (16th note) = 0.125s
      const secondsPerBeat = 60 / state.bpm;
      nextNoteTimeRef.current += secondsPerBeat / 4;

      // Advance to next step (wrapping at 16)
      currentStepRef.current = (currentStepRef.current + 1) % 16;
    }

    // Schedule the next scheduler run using the ref (self-referential callback)
    timerIDRef.current = window.setTimeout(
      schedulerRef.current,
      lookaheadRef.current,
    );
  }, [state.bpm, scheduleNote]);

  // Keep the ref updated with the latest scheduler
  useEffect(() => {
    schedulerRef.current = scheduler;
  }, [scheduler]);

  /**
   * Start playback.
   * Initializes audio if needed, resets timing, and starts the scheduler.
   */
  const start = useCallback(() => {
    if (!audioContextRef.current || state.isPlaying) return;

    // Start from current audio time
    nextNoteTimeRef.current = audioContextRef.current.currentTime;
    setState((prev) => ({ ...prev, isPlaying: true }));
    scheduler();
  }, [state.isPlaying, scheduler]);

  /** Stop playback and reset to step 0 */
  const stop = useCallback(() => {
    if (timerIDRef.current) {
      clearTimeout(timerIDRef.current);
      timerIDRef.current = null;
    }

    currentStepRef.current = 0;
    setState((prev) => ({ ...prev, isPlaying: false, currentStep: 0 }));
  }, []);

  /** Pause playback without resetting position */
  const pause = useCallback(() => {
    if (timerIDRef.current) {
      clearTimeout(timerIDRef.current);
      timerIDRef.current = null;
    }

    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  /** Update BPM, clamped to valid range */
  const setBpm = useCallback((bpm: number) => {
    setState((prev) => ({ ...prev, bpm: Math.max(60, Math.min(180, bpm)) }));
  }, []);

  /** Register callback to be called on each step */
  const setOnStepCallback = useCallback((callback: (step: number) => void) => {
    onStepCallbackRef.current = callback;
  }, []);

  // =============================================================================
  // EFFECTS - Side effects and cleanup
  // =============================================================================

  /** Cleanup: close audio context and clear timeout on unmount */
  useEffect(() => {
    return () => {
      if (timerIDRef.current) {
        clearTimeout(timerIDRef.current);
      }
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
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
