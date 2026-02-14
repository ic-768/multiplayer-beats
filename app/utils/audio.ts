export const AUDIO_CONFIG = {
  LOOKAHEAD: 25,
  SCHEDULE_AHEAD_TIME: 0.1,
  DEFAULT_BPM: 120,
  MIN_BPM: 60,
  MAX_BPM: 180,
} as const;

export const createAudioContext = (): AudioContext => {
  return new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  )();
};

export const createDrumSound = (
  ctx: AudioContext,
  freq: number,
  dur: number,
  v: number,
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  osc.frequency.value = freq;
  osc.type = "sawtooth";
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(v * 0.3, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, now + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur);
};
