import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router";

import { TurnControls } from "~/components/multiplayer/TurnControls";
import { TurnTimer } from "~/components/multiplayer/TurnTimer";
import { Grid } from "~/components/sequencer/Grid";
import { Transport } from "~/components/sequencer/Transport";
import { useAudioSequencer } from "~/hooks/useAudioSequencer";
import { useSocket } from "~/hooks/useSocket";
import { useSequencerStore } from "~/store/sequencer";
import { DEFAULT_INSTRUMENTS } from "~/types";

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get("player") || "Anonymous";

  const [audioInitialized, setAudioInitialized] = useState(false);
  const [roomFull, setRoomFull] = useState(false);
  const {
    init,
    start,
    stop,
    pause,
    setBpm: setAudioBpm,
    setOnStep,
    setCurrentStep,
  } = useAudioSequencer({ instruments: DEFAULT_INSTRUMENTS, steps: 16 });
  const store = useSequencerStore;
  const isPlaying = store((s) => s.isPlaying);
  const bpm = store((s) => s.bpm);
  const steps = store((s) => s.steps);
  const instruments = store((s) => s.instruments);
  const currentStep = store((s) => s.currentStep);
  const setStepsFromServer = store((s) => s.setStepsFromServer);
  const setBpmStore = store((s) => s.setBpm);
  const clearPatternStore = store((s) => s.clearPattern);

  const onStepToggled = useCallback(
    (data: { instrumentIndex: number; stepIndex: number }) =>
      store.getState().toggleStep(data.instrumentIndex, data.stepIndex),
    [store],
  );

  const onBpmChanged = useCallback(
    (data: { bpm: number }) => setBpmStore(data.bpm),
    [setBpmStore],
  );

  const onGameReset = useCallback(
    (data: { steps: boolean[][]; bpm: number }) => {
      setStepsFromServer(data.steps);
      setBpmStore(data.bpm);
    },
    [setStepsFromServer, setBpmStore],
  );

  const onPatternCleared = useCallback(
    () => clearPatternStore(),
    [clearPatternStore],
  );

  const onRoomFull = useCallback(() => setRoomFull(true), []);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const setTurnTimeRemainingRef = useRef<
    ((timeRemaining: number) => void) | null
  >(null);
  const timeRemainingRef = useRef<number>(60);

  const onTurnStarted = useCallback((data: { timeRemaining: number }) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timeRemainingRef.current = data.timeRemaining;
    timerRef.current = setInterval(() => {
      const setTurnTimeRemaining = setTurnTimeRemainingRef.current;
      if (setTurnTimeRemaining) {
        timeRemainingRef.current -= 1;
        setTurnTimeRemaining(timeRemainingRef.current);
        if (timeRemainingRef.current <= 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, 1000);
  }, []);

  const onTurnEnded = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const socket = useSocket({
    roomId: roomId || "",
    playerName,
    onStepToggled,
    onBpmChanged,
    onTurnStarted,
    onTurnEnded,
    onGameReset,
    onPatternCleared,
    onRoomFull,
  });

  useEffect(() => {
    setTurnTimeRemainingRef.current = socket.setTurnTimeRemaining;
  }, [socket.setTurnTimeRemaining]);

  useEffect(() => {
    setOnStep((step: number) => setCurrentStep(step));
  }, [setOnStep, setCurrentStep]);

  useEffect(() => {
    if (socket.roomState) {
      setStepsFromServer(socket.roomState.steps);
      setBpmStore(socket.roomState.bpm);
    }
  }, [socket.roomState, setStepsFromServer, setBpmStore]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const initAudio = async () => {
    if (!audioInitialized) {
      await init();
      setAudioInitialized(true);
    }
  };

  const handlePlay = async () => {
    await initAudio();
    start();
  };

  const handleBpmChange = (newBpm: number) => {
    setAudioBpm(newBpm);
    setBpmStore(newBpm);
    socket.setBpm(newBpm);
  };

  const handleToggleStep = (instrumentIndex: number, stepIndex: number) => {
    if (!isMyTurn) return;
    store.getState().toggleStep(instrumentIndex, stepIndex);
    socket.toggleStep(instrumentIndex, stepIndex);
  };

  const isMyTurn =
    socket.roomState?.turn.isActive &&
    socket.roomState.turn.currentPlayer === socket.playerNumber;

  const handleClearPattern = () => {
    clearPatternStore();
    socket.clearPattern();
  };

  if (roomFull) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">Room Full</h1>
          <p className="mb-4 text-gray-400">This room already has 2 players.</p>
          <a
            href="/"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Room: {roomId}</h1>
            <p className="text-gray-400">
              Playing as: {playerName}
              {socket.playerNumber && ` (Player ${socket.playerNumber})`}
              {!socket.isConnected && " - Connecting..."}
            </p>
          </div>
          <a
            href="/"
            className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
          >
            Leave Room
          </a>
        </div>

        <TurnTimer
          timeRemaining={socket.roomState?.turn.timeRemaining ?? 60}
          currentPlayer={socket.roomState?.turn.currentPlayer ?? 1}
          isActive={socket.roomState?.turn.isActive ?? false}
          round={socket.roomState?.turn.round ?? 1}
        />

        <Transport
          isPlaying={isPlaying}
          bpm={bpm}
          onPlay={handlePlay}
          onPause={pause}
          onStop={stop}
          onBpmChange={handleBpmChange}
          onClear={handleClearPattern}
        />

        <Grid
          instruments={instruments}
          steps={steps}
          currentStep={currentStep}
          onToggleStep={handleToggleStep}
          disabled={!isMyTurn}
        />

        <TurnControls
          isActive={socket.roomState?.turn.isActive ?? false}
          isCurrentPlayer={
            socket.roomState?.turn.currentPlayer === socket.playerNumber
          }
          onStart={socket.startTurn}
          onEnd={socket.endTurn}
          onReset={socket.resetGame}
        />

        <div className="rounded-lg bg-gray-900 p-4 text-sm text-gray-400">
          <p className="mb-2 font-medium text-white">How to play:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Click on the grid to add drum hits</li>
            <li>Press Play to hear your beat</li>
            <li>Use Start Turn to begin your 60-second turn</li>
            <li>Add as many notes as you can before time runs out!</li>
            <li>Players alternate turns, building the beat together</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
