import type { Server, Socket } from "socket.io";

import {
  createEmptySteps,
  deleteRoom,
  getRoom,
  isRoomEmpty,
  isRoomFull,
  rooms,
} from "./rooms";
import { TURN_DURATION } from "./types";

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join-room", (data: { roomId: string; playerName: string }) => {
      const { roomId, playerName } = data;
      const room = getRoom(roomId);
      if (!room) return;

      const existingPlayer = Array.from(room.players.values()).find(
        (p) => p.name.toLowerCase() === playerName.toLowerCase(),
      );
      if (existingPlayer) {
        socket.emit("join-rejected", { reason: "name-taken" });
        return;
      }

      if (isRoomFull(room)) {
        socket.emit("room-full");
        return;
      }

      const playerNum = room.players.size + 1;
      socket.join(roomId);
      room.players.set(socket.id, {
        id: socket.id,
        name: playerName,
        socketId: socket.id,
        playerNumber: playerNum as 1 | 2,
      });

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

      socket.to(roomId).emit("player-joined", {
        playerNumber: playerNum,
        player: { id: socket.id, name: playerName },
      });

      console.log(`Player ${playerName} (P${playerNum}) joined room ${roomId}`);
    });

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

        const player = room.players.get(socket.id);
        if (!player) return;

        if (
          room.turn.isActive &&
          player.playerNumber !== room.turn.currentPlayer
        ) {
          socket.emit("not-your-turn", {
            currentPlayer: room.turn.currentPlayer,
            yourPlayer: player.playerNumber,
          });
          return;
        }

        room.steps[instrumentIndex][stepIndex] =
          !room.steps[instrumentIndex][stepIndex];

        socket.to(roomId).emit("step-toggled", {
          instrumentIndex,
          stepIndex,
          active: room.steps[instrumentIndex][stepIndex],
          playerId: socket.id,
        });
      },
    );

    socket.on("set-bpm", (data: { roomId: string; bpm: number }) => {
      const { roomId, bpm } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.bpm = bpm;
      socket.to(roomId).emit("bpm-changed", { bpm, playerId: socket.id });
    });

    socket.on("start-turn", (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.turn.isActive = true;
      room.turn.timeRemaining = TURN_DURATION;

      io.to(roomId).emit("turn-started", {
        currentPlayer: room.turn.currentPlayer,
        timeRemaining: room.turn.timeRemaining,
        round: room.turn.round,
      });
    });

    socket.on("end-turn", (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.turn.currentPlayer = room.turn.currentPlayer === 1 ? 2 : 1;
      room.turn.isActive = false;
      room.turn.timeRemaining = TURN_DURATION;
      if (room.turn.currentPlayer === 1) {
        room.turn.round += 1;
      }

      io.to(roomId).emit("turn-ended", {
        currentPlayer: room.turn.currentPlayer,
        timeRemaining: room.turn.timeRemaining,
        round: room.turn.round,
      });
    });

    socket.on("reset-game", (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.steps = createEmptySteps();
      room.turn = {
        currentPlayer: 1,
        timeRemaining: TURN_DURATION,
        isActive: false,
        round: 1,
      };

      io.to(roomId).emit("game-reset", {
        steps: room.steps,
        bpm: room.bpm,
        turn: room.turn,
      });
    });

    socket.on("clear-pattern", (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.steps = createEmptySteps();
      io.to(roomId).emit("pattern-cleared");
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);

      for (const [roomId, room] of rooms.entries()) {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);
          socket.to(roomId).emit("player-left", { playerId: socket.id });

          if (isRoomEmpty(room)) {
            deleteRoom(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
          }
        }
      }
    });
  });
}
