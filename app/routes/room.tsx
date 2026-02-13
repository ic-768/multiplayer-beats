import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";

import { TurnTimer } from "~/components/multiplayer/TurnTimer";
import { Grid } from "~/components/sequencer/Grid";
import { Transport } from "~/components/sequencer/Transport";
import { useAudioEngine } from "~/hooks/useAudioEngine";
import { useSequencer } from "~/hooks/useSequencer";
import { useTurnManager } from "~/hooks/useTurnManager";
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

  const audio = useAudioEngine();
  const sequencer = useSequencer({
    instruments: DEFAULT_INSTRUMENTS,
    steps: 16,
  });
  const turn = useTurnManager({ duration: 60 });

  // Initialize audio on first user interaction
  const initAudio = useCallback(async () => {
    if (!audioInitialized) {
      await audio.init();
      setAudioInitialized(true);

      // Load synthesized drum sounds as a fallback
      // These are simple synthesized sounds so we don't need external files
    }
  }, [audio, audioInitialized]);

  // Handle transport controls
  const handlePlay = useCallback(async () => {
    await initAudio();
    audio.setBpm(sequencer.bpm);
    sequencer.setIsPlaying(true);
    audio.start();
  }, [initAudio, audio, sequencer]);

  const handlePause = useCallback(() => {
    sequencer.setIsPlaying(false);
    audio.pause();
  }, [sequencer, audio]);

  const handleStop = useCallback(() => {
    sequencer.setIsPlaying(false);
    sequencer.setCurrentStep(0);
    audio.stop();
  }, [sequencer, audio]);

  const handleBpmChange = useCallback(
    (bpm: number) => {
      sequencer.setBpm(bpm);
      audio.setBpm(bpm);
    },
    [sequencer, audio],
  );

  // Sync audio step with sequencer
  useEffect(() => {
    audio.setOnStepCallback((step) => {
      sequencer.setCurrentStep(step);

      // Play active notes for this step
      const activeNotes = sequencer.getActiveNotesForStep(step);
      activeNotes.forEach(({ instrument, velocity }) => {
        // Use synthesized sounds based on instrument type
        const frequencies: Record<string, number> = {
          kick: 60,
          snare: 200,
          hihat: 800,
          clap: 150,
        };
        const durations: Record<string, number> = {
          kick: 0.5,
          snare: 0.3,
          hihat: 0.1,
          clap: 0.2,
        };

        const freq = frequencies[instrument.id] || 440;
        const duration = durations[instrument.id] || 0.1;

        // Different waveforms for different drums
        audio.playTone(freq, duration, velocity);
      });
    });
  }, [audio, sequencer]);

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Room: {roomId}</h1>
            <p className="text-gray-400">Playing as: {playerName}</p>
          </div>
          <a
            href="/"
            className="rounded bg-gray-800 px-4 py-2 text-white transition-colors hover:bg-gray-700"
          >
            Leave Room
          </a>
        </div>

        {/* Turn Timer */}
        <TurnTimer
          timeRemaining={turn.timeRemaining}
          currentPlayer={turn.currentPlayer}
          isActive={turn.isActive}
          round={turn.round}
        />

        {/* Transport Controls */}
        <Transport
          isPlaying={sequencer.isPlaying}
          bpm={sequencer.bpm}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onBpmChange={handleBpmChange}
          onClear={sequencer.clearPattern}
        />

        {/* Sequencer Grid */}
        <Grid
          instruments={sequencer.instruments}
          steps={sequencer.steps}
          currentStep={sequencer.currentStep}
          onToggleStep={sequencer.toggleStep}
        />

        {/* Turn Controls */}
        <div className="flex gap-4">
          {!turn.isActive ? (
            <button
              onClick={turn.startTurn}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-500"
            >
              Start Turn
            </button>
          ) : (
            <button
              onClick={turn.endTurn}
              className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-500"
            >
              End Turn Early
            </button>
          )}
          <button
            onClick={turn.resetGame}
            className="rounded-lg bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-500"
          >
            Reset Game
          </button>
        </div>

        {/* Instructions */}
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
