import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router";

import { TurnControls } from "~/components/multiplayer/TurnControls";
import { TurnTimer } from "~/components/multiplayer/TurnTimer";
import { Grid } from "~/components/sequencer/Grid";
import { Transport } from "~/components/sequencer/Transport";
import { useAudioSequencer } from "~/hooks/useAudioSequencer";
import { useSocket } from "~/hooks/useSocket";
import { useSequencerStore } from "~/store/sequencer";
import { DEFAULT_INSTRUMENTS } from "~/types";

export function meta({ params }: { params: { roomId: string } }) {
  return [
    { title: `Room ${params.roomId} - Multiplayer Beats` },
    { name: "description", content: "Collaborative beat making session" },
  ];
}

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
  } = useAudioSequencer({
    instruments: DEFAULT_INSTRUMENTS,
    steps: 16,
  });

  const isPlaying = useSequencerStore((s) => s.isPlaying);
  const bpm = useSequencerStore((s) => s.bpm);
  const steps = useSequencerStore((s) => s.steps);
  const instruments = useSequencerStore((s) => s.instruments);
  const currentStep = useSequencerStore((s) => s.currentStep);

  const setStepsFromServer = useSequencerStore((s) => s.setStepsFromServer);
  const setBpmStore = useSequencerStore((s) => s.setBpm);
  const clearPatternStore = useSequencerStore((s) => s.clearPattern);

  const socket = useSocket({
    roomId: roomId || "",
    playerName,
    onStepToggled: (data) => {
      useSequencerStore
        .getState()
        .toggleStep(data.instrumentIndex, data.stepIndex);
    },
    onBpmChanged: (data) => {
      setBpmStore(data.bpm);
    },
    onTurnStarted: () => {},
    onTurnEnded: () => {},
    onGameReset: (data) => {
      setStepsFromServer(data.steps);
      setBpmStore(data.bpm);
    },
    onPatternCleared: () => {
      clearPatternStore();
    },
    onRoomFull: () => {
      setRoomFull(true);
    },
  });

  useEffect(() => {
    setOnStep((step: number) => {
      setCurrentStep(step);
    });
  }, [setOnStep, setCurrentStep]);

  useEffect(() => {
    if (socket.roomState) {
      setStepsFromServer(socket.roomState.steps);
      setBpmStore(socket.roomState.bpm);
    }
  }, [socket.roomState, setStepsFromServer, setBpmStore]);

  async function initAudio() {
    if (!audioInitialized) {
      await init();
      setAudioInitialized(true);
    }
  }

  async function handlePlay() {
    await initAudio();
    start();
  }

  function handlePause() {
    pause();
  }

  function handleStop() {
    stop();
  }

  function handleBpmChange(bpm: number) {
    setAudioBpm(bpm);
    setBpmStore(bpm);
    socket.setBpm(bpm);
  }

  function handleToggleStep(instrumentIndex: number, stepIndex: number) {
    useSequencerStore.getState().toggleStep(instrumentIndex, stepIndex);
    socket.toggleStep(instrumentIndex, stepIndex);
  }

  function handleClearPattern() {
    clearPatternStore();
    socket.clearPattern();
  }

  function handleStartTurn() {
    socket.startTurn();
  }

  function handleEndTurn() {
    socket.endTurn();
  }

  function handleResetGame() {
    socket.resetGame();
  }

  if (roomFull) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">Room Full</h1>
          <p className="mb-4 text-gray-400">This room already has 2 players.</p>
          <a
            href="/"
            className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
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
            className="rounded bg-gray-800 px-4 py-2 text-white transition-colors hover:bg-gray-700"
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
          onPause={handlePause}
          onStop={handleStop}
          onBpmChange={handleBpmChange}
          onClear={handleClearPattern}
        />

        <Grid
          instruments={instruments}
          steps={steps}
          currentStep={currentStep}
          onToggleStep={handleToggleStep}
        />

        <TurnControls
          isActive={socket.roomState?.turn.isActive ?? false}
          onStart={handleStartTurn}
          onEnd={handleEndTurn}
          onReset={handleResetGame}
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
