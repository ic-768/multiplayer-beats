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
