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

export interface SequencerState {
  steps: Step[][]; // [instrument][step]
  currentStep: number;
  isPlaying: boolean;
  bpm: number;
}

export interface TurnState {
  currentPlayer: 1 | 2;
  timeRemaining: number;
  isActive: boolean;
  round: number;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
}

export interface RoomState {
  roomId: string;
  players: [Player | null, Player | null];
  sequencer: SequencerState;
  turn: TurnState;
}

export const DEFAULT_INSTRUMENTS: Instrument[] = [
  { id: "kick", name: "Kick", color: "#ef4444" },
  { id: "snare", name: "Snare", color: "#3b82f6" },
  { id: "hihat", name: "Hi-Hat", color: "#22c55e" },
  { id: "clap", name: "Clap", color: "#eab308" },
];

export const DEFAULT_STEPS = 16;
export const TURN_DURATION = 60; // seconds
