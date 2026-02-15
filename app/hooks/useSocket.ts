import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface RoomState {
  id: string;
  steps: boolean[][];
  bpm: number;
  turn: {
    currentPlayer: 1 | 2;
    timeRemaining: number;
    isActive: boolean;
    round: number;
  };
  players: Array<{ id: string; name: string; socketId: string }>;
}

export interface UseSocketOptions {
  roomId: string;
  playerName: string;
  onStepToggled?: (data: {
    instrumentIndex: number;
    stepIndex: number;
    active: boolean;
    playerId: string;
  }) => void;
  onBpmChanged?: (data: { bpm: number; playerId: string }) => void;
  onTurnStarted?: (data: {
    currentPlayer: 1 | 2;
    timeRemaining: number;
    round: number;
  }) => void;
  onTurnEnded?: (data: {
    currentPlayer: 1 | 2;
    timeRemaining: number;
    round: number;
  }) => void;
  onGameReset?: (data: {
    steps: boolean[][];
    bpm: number;
    turn: RoomState["turn"];
  }) => void;
  onPatternCleared?: () => void;
  onPlayerJoined?: (data: {
    playerNumber: number;
    player: { id: string; name: string };
  }) => void;
  onPlayerLeft?: (data: { playerId: string }) => void;
  onRoomFull?: () => void;
}

export const useSocket = ({
  roomId,
  playerName,
  onStepToggled,
  onBpmChanged,
  onTurnStarted,
  onTurnEnded,
  onGameReset,
  onPatternCleared,
  onPlayerJoined,
  onPlayerLeft,
  onRoomFull,
}: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-room", { roomId, playerName });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(
      "joined-room",
      (data: { playerNumber: number; room: RoomState }) => {
        setPlayerNumber(data.playerNumber);
        setRoomState(data.room);
      },
    );

    socket.on("room-full", () => {
      onRoomFull?.();
    });

    socket.on("step-toggled", (data) => {
      onStepToggled?.(data);
    });

    socket.on("bpm-changed", (data) => {
      onBpmChanged?.(data);
    });

    socket.on("turn-started", (data) => {
      onTurnStarted?.(data);
    });

    socket.on("turn-ended", (data) => {
      onTurnEnded?.(data);
    });

    socket.on("game-reset", (data) => {
      onGameReset?.(data);
    });

    socket.on("pattern-cleared", () => {
      onPatternCleared?.();
    });

    socket.on("player-joined", (data) => {
      onPlayerJoined?.(data);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, data.player],
        };
      });
    });

    socket.on("player-left", (data) => {
      onPlayerLeft?.(data);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== data.playerId),
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [
    roomId,
    playerName,
    onStepToggled,
    onBpmChanged,
    onTurnStarted,
    onTurnEnded,
    onGameReset,
    onPatternCleared,
    onPlayerJoined,
    onPlayerLeft,
    onRoomFull,
  ]);

  const toggleStep = useCallback(
    (instrumentIndex: number, stepIndex: number) => {
      socketRef.current?.emit("toggle-step", {
        roomId,
        instrumentIndex,
        stepIndex,
      });
    },
    [roomId],
  );

  const setBpm = useCallback(
    (bpm: number) => {
      socketRef.current?.emit("set-bpm", { roomId, bpm });
    },
    [roomId],
  );

  const startTurn = useCallback(() => {
    socketRef.current?.emit("start-turn", { roomId });
  }, [roomId]);

  const endTurn = useCallback(() => {
    socketRef.current?.emit("end-turn", { roomId });
  }, [roomId]);

  const resetGame = useCallback(() => {
    socketRef.current?.emit("reset-game", { roomId });
  }, [roomId]);

  const clearPattern = useCallback(() => {
    socketRef.current?.emit("clear-pattern", { roomId });
  }, [roomId]);

  return {
    isConnected,
    roomState,
    playerNumber,
    toggleStep,
    setBpm,
    startTurn,
    endTurn,
    resetGame,
    clearPattern,
  };
};
