import { useCallback, useEffect, useRef, useState } from "react";

import type { TurnState } from "~/types";

/**
 * Options for the turn manager hook.
 */
interface UseTurnManagerOptions {
  /** Duration of each turn in seconds (default 60) */
  duration?: number;
  /** Callback fired when a turn ends */
  onTurnEnd?: (player: 1 | 2) => void;
}

/**
 * Turn-based game logic hook.
 * Manages the 60-second turn timer, player alternation, and round tracking.
 */
export const useTurnManager = ({
  duration = 60,
  onTurnEnd,
}: UseTurnManagerOptions = {}) => {
  // State for UI rendering
  const [state, setState] = useState<TurnState>({
    currentPlayer: 1,
    timeRemaining: duration,
    isActive: false,
    round: 1,
  });

  // Use a ref for the timer ID to avoid stale closure issues in the effect
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  // Keep a ref to the current player for the interval to access
  const currentPlayerRef = useRef<1 | 2>(1);

  // Start a new turn - resets timer and activates
  const startTurn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      timeRemaining: duration,
    }));
  }, [duration]);

  // Pause the current turn (timer stops but state is preserved)
  const pauseTurn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  // End the current turn manually or automatically
  const endTurn = useCallback(() => {
    // Clear the timer
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }

    // Determine next player and round
    setState((prev) => {
      const nextPlayer: 1 | 2 = prev.currentPlayer === 1 ? 2 : 1;
      const nextRound = prev.currentPlayer === 2 ? prev.round + 1 : prev.round;

      // Call the callback after state calculation
      // Use setTimeout to avoid calling setState during render
      setTimeout(() => {
        onTurnEnd?.(prev.currentPlayer);
      }, 0);

      return {
        currentPlayer: nextPlayer,
        timeRemaining: duration,
        isActive: false,
        round: nextRound,
      };
    });
  }, [duration, onTurnEnd]);

  // Reset everything to initial state
  const resetGame = useCallback(() => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }

    setState({
      currentPlayer: 1,
      timeRemaining: duration,
      isActive: false,
      round: 1,
    });
  }, [duration]);

  // Timer effect - runs when turn is active
  useEffect(() => {
    // Only run timer when turn is active and time remains
    if (!state.isActive || state.timeRemaining <= 0) {
      return;
    }

    // Start a new interval
    const id = setInterval(() => {
      setState((prev) => {
        const newTime = prev.timeRemaining - 1;

        if (newTime <= 0) {
          // Time's up - auto-end the turn
          // We need to schedule this outside the setState to avoid issues
          setTimeout(() => endTurn(), 0);
          return { ...prev, timeRemaining: 0 };
        }

        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    timerIdRef.current = id;

    // Cleanup on unmount or when dependencies change
    return () => {
      clearInterval(id);
    };
  }, [state.isActive, state.timeRemaining, endTurn]);

  // Update ref whenever player changes
  useEffect(() => {
    currentPlayerRef.current = state.currentPlayer;
  }, [state.currentPlayer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTurn,
    pauseTurn,
    endTurn,
    resetGame,
  };
};
