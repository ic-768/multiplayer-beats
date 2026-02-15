export interface TurnState {
  currentPlayer: 1 | 2;
  timeRemaining: number;
  isActive: boolean;
  round: number;
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
}

export interface RoomState {
  id: string;
  steps: boolean[][];
  bpm: number;
  turn: TurnState;
  players: Player[];
}
