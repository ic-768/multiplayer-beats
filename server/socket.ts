/**
 * Socket.IO event handlers for real-time multiplayer sync.
 *
 * This module handles:
 * - Room creation and player joining (max 2 players per room)
 * - Step toggling on the sequencer grid
 * - BPM synchronization
 * - Turn management (start/end turns, timer, rounds)
 * - Game reset and pattern clearing
 * - Player disconnection and room cleanup
 *
 * Room state is stored in memory (not persisted). Each room contains:
 * - players: Map of connected players
 * - steps: 2D boolean array [instrument][step] representing the pattern
 * - bpm: current tempo
 * - turn: current turn state (player, time remaining, active, round)
 */

import type { Server, Socket } from "socket.io";

interface Room {
  id: string;
  players: Map<string, { id: string; name: string; socketId: string }>;
  steps: boolean[][];
  bpm: number;
  turn: {
    currentPlayer: 1 | 2;
    timeRemaining: number;
    isActive: boolean;
    round: number;
  };
}

// In-memory room storage
const rooms = new Map<string, Room>();

// Must match the instruments defined in app/types/index.ts
const INSTRUMENTS = ["kick", "snare", "hihat", "clap"];
const STEPS = 16;

/**
 * Creates an empty step matrix for the sequencer.
 * All steps default to inactive (false).
 */
function createEmptySteps(): boolean[][] {
  return INSTRUMENTS.map(() => Array(STEPS).fill(false));
}

/**
 * Gets an existing room or creates a new one if it doesn't exist.
 * Rooms are created on-demand when the first player joins.
 */
function getRoom(roomId: string): Room | undefined {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      players: new Map(),
      steps: createEmptySteps(),
      bpm: 120,
      turn: {
        currentPlayer: 1,
        timeRemaining: 60,
        isActive: false,
        round: 1,
      },
    });
  }
  return rooms.get(roomId);
}

/**
 * Sets up all Socket.IO event handlers.
 * This is called once when the server starts, for both dev and prod.
 */
export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    /**
     * Player joins a room.
     * Maximum 2 players per room. If full, emits "room-full" event.
     */
    socket.on("join-room", (data: { roomId: string; playerName: string }) => {
      const { roomId, playerName } = data;
      const room = getRoom(roomId);
      if (!room) return;

      const playerNum = room.players.size + 1;
      if (playerNum > 2) {
        socket.emit("room-full");
        return;
      }

      socket.join(roomId);
      room.players.set(socket.id, {
        id: socket.id,
        name: playerName,
        socketId: socket.id,
      });

      // Send room state to the joining player
      socket.emit("joined-room", {
        playerNumber: playerNum,
        room: {
          id: room.id,
          steps: room.steps,
          bpm: room.bpm,
          turn: room.turn,
          players: Array.from(room.players.values()),
        },
      });

      // Notify other players in the room
      socket.to(roomId).emit("player-joined", {
        playerNumber: playerNum,
        player: { id: socket.id, name: playerName },
      });

      console.log(`Player ${playerName} (P${playerNum}) joined room ${roomId}`);
    });

    /**
     * Toggle a step on the sequencer grid.
     * Broadcasts the change to all other players in the room.
     */
    socket.on(
      "toggle-step",
      (data: {
        roomId: string;
        instrumentIndex: number;
        stepIndex: number;
      }) => {
        const { roomId, instrumentIndex, stepIndex } = data;
        const room = rooms.get(roomId);
        if (!room) return;

        // Toggle the step
        room.steps[instrumentIndex][stepIndex] =
          !room.steps[instrumentIndex][stepIndex];

        // Broadcast to other players
        socket.to(roomId).emit("step-toggled", {
          instrumentIndex,
          stepIndex,
          active: room.steps[instrumentIndex][stepIndex],
          playerId: socket.id,
        });
      },
    );

    /**
     * Update BPM. Broadcasts to other players in the room.
     */
    socket.on("set-bpm", (data: { roomId: string; bpm: number }) => {
      const { roomId, bpm } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.bpm = bpm;
      socket.to(roomId).emit("bpm-changed", { bpm, playerId: socket.id });
    });

    /**
     * Start a new turn. Resets timer to 60 seconds.
     */
    socket.on("start-turn", (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.turn.isActive = true;
      room.turn.timeRemaining = 60;

      io.to(roomId).emit("turn-started", {
        currentPlayer: room.turn.currentPlayer,
        timeRemaining: room.turn.timeRemaining,
        round: room.turn.round,
      });
    });

    /**
     * End the current turn manually.
     * Switches to the other player and increments round if going back to P1.
     */
    socket.on("end-turn", (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.turn.currentPlayer = room.turn.currentPlayer === 1 ? 2 : 1;
      room.turn.isActive = false;
      room.turn.timeRemaining = 60;
      // Increment round when returning to player 1
      if (room.turn.currentPlayer === 1) {
        room.turn.round += 1;
      }

      io.to(roomId).emit("turn-ended", {
        currentPlayer: room.turn.currentPlayer,
        timeRemaining: room.turn.timeRemaining,
        round: room.turn.round,
      });
    });

    /**
     * Reset the entire game (clears pattern, resets turn state).
     */
    socket.on("reset-game", (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.steps = createEmptySteps();
      room.turn = {
        currentPlayer: 1,
        timeRemaining: 60,
        isActive: false,
        round: 1,
      };

      io.to(roomId).emit("game-reset", {
        steps: room.steps,
        bpm: room.bpm,
        turn: room.turn,
      });
    });

    /**
     * Clear the pattern (set all steps to inactive).
     */
    socket.on("clear-pattern", (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.steps = createEmptySteps();
      io.to(roomId).emit("pattern-cleared");
    });

    /**
     * Handle client disconnect.
     * Removes player from room and deletes room if empty.
     */
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);

      for (const [roomId, room] of rooms.entries()) {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);
          socket.to(roomId).emit("player-left", { playerId: socket.id });

          // Clean up empty rooms
          if (room.players.size === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
          }
        }
      }
    });
  });
}
