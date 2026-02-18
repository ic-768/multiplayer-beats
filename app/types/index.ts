export interface Step {
  active: boolean;
  velocity: number; // 0-1
}

export interface Instrument {
  id: string;
  name: string;
  color: string;
  sampleUrl?: string;
}

export const DEFAULT_INSTRUMENTS: Instrument[] = [
  { id: "kick", name: "Kick", color: "#ef4444" },
  { id: "snare", name: "Snare", color: "#3b82f6" },
  { id: "hihat", name: "Hi-Hat", color: "#22c55e" },
  { id: "clap", name: "Clap", color: "#eab308" },
];

export const PIANO_NOTES = [
  "C3",
  "C#3",
  "D3",
  "D#3",
  "E3",
  "F3",
  "F#3",
  "G3",
  "G#3",
  "A3",
  "A#3",
  "B3",
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
] as const;
