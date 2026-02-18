import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

import type { Player, RoomState, TurnState } from "~/types/socket";

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
  onTurnStarted?: (data: TurnState) => void;
  onTurnEnded?: (data: TurnState) => void;
  onGameReset?: (data: {
    steps: boolean[][];
    bpm: number;
    turn: TurnState;
  }) => void;
  onPatternCleared?: () => void;
  onPlayerJoined?: (data: { playerNumber: number; player: Player }) => void;
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

  const handleStepToggled = useEffectEvent(
    (data: Parameters<NonNullable<typeof onStepToggled>>[0]) => {
      onStepToggled?.(data);
    },
  );

  const handleBpmChanged = useEffectEvent(
    (data: Parameters<NonNullable<typeof onBpmChanged>>[0]) => {
      onBpmChanged?.(data);
    },
  );

  const handleTurnStarted = useEffectEvent((data: TurnState) => {
    onTurnStarted?.(data);
    setRoomState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        turn: { ...prev.turn, ...data },
      };
    });
  });

  const handleTurnEnded = useEffectEvent((data: TurnState) => {
    onTurnEnded?.(data);
    setRoomState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        turn: { ...prev.turn, ...data },
      };
    });
  });

  const handleGameReset = useEffectEvent(
    (data: Parameters<NonNullable<typeof onGameReset>>[0]) => {
      onGameReset?.(data);
    },
  );

  const handlePatternCleared = useEffectEvent(() => {
    onPatternCleared?.();
  });

  const handlePlayerJoined = useEffectEvent(
    (data: Parameters<NonNullable<typeof onPlayerJoined>>[0]) => {
      onPlayerJoined?.(data);
      if (data.player.socketId) {
        setRoomState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: [...prev.players, data.player as Player],
          };
        });
      }
    },
  );

  const handlePlayerLeft = useEffectEvent(
    (data: Parameters<NonNullable<typeof onPlayerLeft>>[0]) => {
      onPlayerLeft?.(data);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== data.playerId),
        };
      });
    },
  );

  const handleRoomFull = useEffectEvent(() => {
    onRoomFull?.();
  });

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-room", { roomId, playerName });
    });

    socket.on("disconnect", () => setIsConnected(false));
    socket.on(
      "joined-room",
      (data: { playerNumber: number; room: RoomState }) => {
        setPlayerNumber(data.playerNumber);
        setRoomState(data.room);
      },
    );
    socket.on("room-full", () => handleRoomFull());
    socket.on("join-rejected", ({ reason }: { reason: string }) => {
      if (reason === "name-taken") {
        alert(
          "This name is already taken in this room. Please use a different name.",
        );
        window.location.href = "/";
      }
    });
    socket.on(
      "step-toggled",
      (data: Parameters<NonNullable<typeof onStepToggled>>[0]) =>
        handleStepToggled(data),
    );
    socket.on(
      "bpm-changed",
      (data: Parameters<NonNullable<typeof onBpmChanged>>[0]) =>
        handleBpmChanged(data),
    );
    socket.on("turn-started", (data: TurnState) => handleTurnStarted(data));
    socket.on("turn-ended", (data: TurnState) => handleTurnEnded(data));
    socket.on(
      "game-reset",
      (data: Parameters<NonNullable<typeof onGameReset>>[0]) =>
        handleGameReset(data),
    );
    socket.on("pattern-cleared", () => handlePatternCleared());

    socket.on(
      "player-joined",
      (data: Parameters<NonNullable<typeof onPlayerJoined>>[0]) => {
        handlePlayerJoined(data);
      },
    );

    socket.on(
      "player-left",
      (data: Parameters<NonNullable<typeof onPlayerLeft>>[0]) => {
        handlePlayerLeft(data);
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [roomId, playerName]);

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

  const setTurnTimeRemaining = useCallback((timeRemaining: number) => {
    setRoomState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        turn: { ...prev.turn, timeRemaining },
      };
    });
  }, []);

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
    setTurnTimeRemaining,
  };
};
