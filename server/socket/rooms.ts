import type { Player, Room } from "./types";
import { DEFAULT_BPM, INSTRUMENTS, STEPS, TURN_DURATION } from "./types";

export const rooms = new Map<string, Room>();

export function createEmptySteps(): boolean[][] {
  return INSTRUMENTS.map(() => Array(STEPS).fill(false));
}

export function getRoom(roomId: string): Room | undefined {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      players: new Map(),
      steps: createEmptySteps(),
      pianoSteps: new Map(),
      bpm: DEFAULT_BPM,
      turn: {
        currentPlayer: 1,
        timeRemaining: TURN_DURATION,
        isActive: false,
        round: 1,
      },
    });
  }
  return rooms.get(roomId);
}

export function getPlayerCount(room: Room): number {
  return room.players.size;
}

export function addPlayerToRoom(room: Room, player: Player): number {
  return room.players.set(player.id, player).size;
}

export function removePlayerFromRoom(room: Room, playerId: string): void {
  room.players.delete(playerId);
}

export function isRoomFull(room: Room): boolean {
  return room.players.size >= 2;
}

export function isRoomEmpty(room: Room): boolean {
  return room.players.size === 0;
}

export function deleteRoom(roomId: string): boolean {
  return rooms.delete(roomId);
}
