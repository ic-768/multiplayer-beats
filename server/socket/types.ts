export interface Player {
  id: string;
  name: string;
  socketId: string;
  playerNumber: 1 | 2;
}

export interface TurnState {
  currentPlayer: 1 | 2;
  timeRemaining: number;
  isActive: boolean;
  round: number;
}

export interface Room {
  id: string;
  players: Map<string, Player>;
  steps: boolean[][];
  bpm: number;
  turn: TurnState;
}

export const INSTRUMENTS = ["kick", "snare", "hihat", "clap"] as const;
export const STEPS = 16;
export const DEFAULT_BPM = 120;
export const TURN_DURATION = 60;
