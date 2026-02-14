export const AUDIO_CONFIG = {
  LOOKAHEAD: 25,
  SCHEDULE_AHEAD_TIME: 0.1,
  DEFAULT_BPM: 120,
  MIN_BPM: 60,
  MAX_BPM: 180,
} as const;

export const DRUM_SAMPLES: Record<string, string> = {
  kick: "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
  snare: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
  hihat: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
  clap: "https://tonejs.github.io/audio/drum-samples/CR78/handclap.mp3",
};

export const DRUM_SOUNDS: Record<
  string,
  { frequency: number; duration: number }
> = {
  kick: { frequency: 60, duration: 0.5 },
  snare: { frequency: 200, duration: 0.3 },
  hihat: { frequency: 800, duration: 0.1 },
  clap: { frequency: 150, duration: 0.2 },
};
