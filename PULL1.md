# Phase 1 Implementation: Foundation

This PR implements Phase 1 of the Multiplayer Beats roadmap, establishing the core audio engine, sequencer grid, and turn-based game system.

## Summary of Changes

### New Files Created (15 files)

#### Core Types

**`app/types/index.ts`**

- Defines TypeScript interfaces for the entire application
- `Step`: Individual grid cell with `active` boolean and `velocity` (0-1)
- `Instrument`: Drum instrument with id, name, color, and optional sample URL
- `SequencerState`: Grid state, current playback step, play status, BPM
- `TurnState`: Current player (1 or 2), time remaining, active status, round number
- `Player` & `RoomState`: Multiplayer session management
- Default constants: `DEFAULT_INSTRUMENTS` (kick, snare, hihat, clap), `DEFAULT_STEPS = 16`, `TURN_DURATION = 60`

#### Utilities

**`app/utils/audio.ts`**

- `AUDIO_CONFIG`: Constants for lookahead scheduling (25ms interval, 0.1s schedule-ahead), BPM range (60-180), default BPM (120)
- `DRUM_SAMPLES`: URLs for audio samples (kick, snare, hihat, clap) loaded from Tone.js and GitHub

**`app/utils/sequencer.ts`**

- `createInitialSteps()`: Creates empty step matrix for given instruments and step count

#### State Management

**`app/store/sequencer.ts`**

- Zustand store for sequencer state
- Methods: toggleStep, setStepVelocity, clearPattern, BPM management
- Note: setStepVelocity and totalSteps are implemented but not yet connected to UI

#### Custom Hooks

**`app/hooks/useAudioSequencer.ts`**
Combined audio engine and sequencer hook:

- AudioContext initialization and sample loading (from `DRUM_SAMPLES` URLs)
- Lookahead scheduler for precise playback timing
- Sequencer state management (grid, steps, notes)
- Transport controls: start(), stop(), pause()
- BPM and step management
- Generic `playToneAt()` for synthesized tones (fallback)

**`app/hooks/useTurnManager.ts`**
Turn-based game logic hook providing:

- 60-second countdown timer with 1-second interval updates
- Automatic turn end when timer reaches 0
- Player alternation (Player 1 ↔ Player 2)
- Round progression tracking
- Manual turn controls: `startTurn()`, `endTurn()`, `pauseTurn()`, `resetGame()`

#### UI Components

**`app/components/sequencer/Step.tsx`**

- Individual grid cell component (exports `StepComponent`)
- Visual states: inactive (gray), active (instrument color with velocity opacity)
- Current step highlight (white ring)
- Click handler for toggling notes

**`app/components/sequencer/InstrumentRow.tsx`**

- Horizontal row of 16 steps for a single instrument
- Instrument label with color-coded background
- Delegates step rendering to Step component

**`app/components/sequencer/Grid.tsx`**

- Container for all instrument rows
- 4 rows (kick, snare, hi-hat, clap) × 16 steps
- Scrollable overflow for smaller screens

**`app/components/sequencer/Transport.tsx`**

- Play and Pause buttons (separate controls)
- Stop button
- BPM input field (60-180 range)
- Clear pattern button
- Styled with Tailwind CSS

**`app/components/multiplayer/TurnTimer.tsx`**

- Displays current round number
- Shows which player's turn it is (color-coded: blue for P1, purple for P2)
- 60-second countdown with visual feedback:
  - Green: >30s remaining
  - Yellow: 10-30s remaining
  - Red + pulse animation: <10s remaining

**`app/components/multiplayer/TurnControls.tsx`**

- Reusable turn control buttons
- Start Turn (blue), End Turn Early (green), Reset Game (gray)
- Conditional rendering based on turn active state

**`app/components/multiplayer/CreateRoomForm.tsx`**

- Landing page form for creating new rooms
- Player name input
- Generates random 6-character room ID
- Navigates to `/room/{roomId}?player={name}`

**`app/components/multiplayer/JoinRoomForm.tsx`**

- Landing page form for joining existing rooms
- Player name and room code inputs
- Navigates to room with query parameters

**`app/routes/room.tsx`**

- Main sequencer interface route (`/room/:roomId`)
- Integrates all hooks and components
- URL parameters: `roomId` (path), `player` (query)
- Features:
  - Audio initialization on first Play click
  - Sample-based drum playback via AudioBuffers
  - Turn controls (Start Turn, End Early, Reset)
  - Instructions panel

### Modified Files

**`app/routes.ts`**

```typescript
// Before:
export default [index("routes/home.tsx")] satisfies RouteConfig;

// After:
export default [
  index("routes/home.tsx"),
  route("room/:roomId", "routes/room.tsx"),
] satisfies RouteConfig;
```

- Added room route for multiplayer sessions

**`app/routes/home.tsx`**

- Replaced default Welcome component with custom landing page
- Two-column layout: Create Room | Join Room
- App title and description
- "How it works" explanation

## Architecture Decisions

### Technology Stack

- **React Router v7**: File-based routing with dynamic room routes
- **Zustand**: Lightweight state management for sequencer state
- **Tailwind CSS v4**: Utility-first styling with responsive breakpoints
- **Web Audio API**: Low-latency audio playback with lookahead scheduling

### Audio Engine

- **Lookahead Scheduler Pattern**: Instead of using `setInterval` for playback timing (which is imprecise), we use the Web Audio API's high-resolution clock. The scheduler runs every 25ms and schedules notes 100ms ahead, ensuring rock-solid timing even under load.
- **Sample-Based Playback**: Drum sounds are loaded from external URLs (Tone.js drum samples). The `loadSample()` function fetches and decodes audio files into AudioBuffers for low-latency playback.
- **Synthesizer Fallback**: The `playToneAt()` function provides a generic sawtooth oscillator for basic tone generation if samples fail to load.

### Utility Modules

- **Separation of Concerns**: Audio configuration, sample URLs, and context creation are extracted to dedicated utility modules for reusability and testability.
- **DRUM_SAMPLES Constant**: Centralized mapping of instrument IDs to sample URLs for consistent audio loading.

### State Management

- **Separate Hooks**: Audio, sequencer, and turn logic are separated into focused hooks for better maintainability and testability.
- **Functional Updates**: All state updates use functional form to avoid stale closure issues.
- **Refs for Mutable Values**: Audio timing variables (nextNoteTime, currentStep, timerID) use refs to avoid re-renders during playback.

### Component Structure

- **Composition Pattern**: Grid → InstrumentRow → Step hierarchy allows for flexible layout changes
- **Extracted Controls**: Turn controls extracted to dedicated `TurnControls` component for reusability
- **Controlled Components**: All UI state is managed by hooks, making components pure and predictable
- **Tailwind CSS**: Consistent styling using utility classes, responsive design with sm: prefixes

## How to Test

1. Start the dev server:

   ```bash
   npm run dev
   ```

2. Open http://localhost:5173

3. Create a room:
   - Enter your name
   - Click "Create Room"

4. Test the sequencer:
   - Click grid cells to add drum hits
   - Click "Play" to hear the beat
   - Adjust BPM
   - Click "Start Turn" to begin 60-second countdown
   - Watch timer change colors as it counts down
   - Try "End Turn Early" to switch players
   - Use "Leave Room" to return to home

5. Join from another browser tab:
   - Copy the room code from the URL
   - On the landing page, use "Join Room" with a different name
   - (Note: Real-time sync comes in Phase 3, currently each tab is independent)

## Type Safety

All TypeScript types are defined in `app/types/index.ts`. Run type checking:

```bash
npm run typecheck
```

## Next Steps (Phase 2)

- Real-time multiplayer sync (WebSocket/Server-Sent Events)
- Pattern management (save/load patterns)
- Visual playhead improvements (smooth animation, better highlight)
- Room persistence and player management

## Code Quality

- ✅ TypeScript strict mode compatible
- ✅ React hooks rules followed
- ✅ No console errors (warnings only for sample loading failures)
- ✅ Responsive design
- ✅ Accessible button labels
- ✅ All files under 150 lines

## Known Limitations

- No velocity UI control (stored but not adjustable in UI)
- No pattern undo/redo
- Extended patterns (32/64 steps) not supported
- No visual playhead improvements beyond current step highlight
- Real-time multiplayer sync not yet implemented (Phase 3)
- `createInitialSteps()` in utils/sequencer.ts is unused (store has its own)
