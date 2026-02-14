import { useCallback, useState } from "react";
import { useParams, useSearchParams } from "react-router";

import { TurnControls } from "~/components/multiplayer/TurnControls";
import { TurnTimer } from "~/components/multiplayer/TurnTimer";
import { Grid } from "~/components/sequencer/Grid";
import { Transport } from "~/components/sequencer/Transport";
import { useAudioEngine } from "~/hooks/useAudioEngine";
import { useSequencer } from "~/hooks/useSequencer";
import { useStepCallback } from "~/hooks/useStepCallback";
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

  useStepCallback({ audio, sequencer });

  const initAudio = useCallback(async () => {
    if (!audioInitialized) {
      await audio.init();
      setAudioInitialized(true);
    }
  }, [audio, audioInitialized]);

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

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
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

        <TurnTimer
          timeRemaining={turn.timeRemaining}
          currentPlayer={turn.currentPlayer}
          isActive={turn.isActive}
          round={turn.round}
        />

        <Transport
          isPlaying={sequencer.isPlaying}
          bpm={sequencer.bpm}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onBpmChange={handleBpmChange}
          onClear={sequencer.clearPattern}
        />

        <Grid
          instruments={sequencer.instruments}
          steps={sequencer.steps}
          currentStep={sequencer.currentStep}
          onToggleStep={sequencer.toggleStep}
        />

        <TurnControls
          isActive={turn.isActive}
          onStart={turn.startTurn}
          onEnd={turn.endTurn}
          onReset={turn.resetGame}
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
