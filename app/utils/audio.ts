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
  clap: "https://raw.githubusercontent.com/cleary/samples-hydrogen-drums/main/h2ogmcp/HandClap.wav",
};
