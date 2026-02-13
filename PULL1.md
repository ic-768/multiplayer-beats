# Phase 1 Implementation: Foundation

This PR implements Phase 1 of the Multiplayer Beats roadmap, establishing the core audio engine, sequencer grid, and turn-based game system.

## Summary of Changes

### New Files Created (11 files)

#### Core Types

**`app/types/index.ts`**

- Defines TypeScript interfaces for the entire application
- `Step`: Individual grid cell with `active` boolean and `velocity` (0-1)
- `Instrument`: Drum instrument with id, name, color, and optional sample URL
- `SequencerState`: Grid state, current playback step, play status, BPM
- `TurnState`: Current player (1 or 2), time remaining, active status, round number
- `Player` & `RoomState`: Multiplayer session management
- Default constants: `DEFAULT_INSTRUMENTS` (kick, snare, hihat, clap), `DEFAULT_STEPS = 16`, `TURN_DURATION = 60`

#### Custom Hooks

**`app/hooks/useAudioEngine.ts`**
Web Audio API management hook providing:

- AudioContext initialization (with user gesture requirement handling)
- Sample loading system for external audio files
- **Synthesized drum sounds** as fallback (kick, snare, hi-hat, clap using oscillators)
- **Precise audio scheduler** using lookahead pattern (25ms intervals, 100ms schedule-ahead)
- Transport controls: `start()`, `stop()`, `pause()`
- BPM management (60-180 range)
- Step callback registration for sequencer sync

**`app/hooks/useSequencer.ts`**
Sequencer state management hook providing:

- 16×4 grid initialization (16 steps × 4 instruments)
- `toggleStep(instrumentIndex, stepIndex)`: Toggle note on/off
- `setStepVelocity()`: Adjust note velocity (volume)
- `clearPattern()`: Reset entire grid
- `getActiveNotesForStep(stepIndex)`: Get all active notes for audio playback
- BPM and playback state management

**`app/hooks/useTurnManager.ts`**
Turn-based game logic hook providing:

- 60-second countdown timer with 1-second interval updates
- Automatic turn end when timer reaches 0
- Player alternation (Player 1 ↔ Player 2)
- Round progression tracking
- Manual turn controls: `startTurn()`, `endTurn()`, `pauseTurn()`, `resetGame()`

#### UI Components

**`app/components/sequencer/Step.tsx`**

- Individual grid cell component
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

- Playback controls: Play/Pause toggle, Stop button
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
  - Synthesized drum playback using `playTone()`
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

### Audio Engine

- **Lookahead Scheduler Pattern**: Instead of using `setInterval` for playback timing (which is imprecise), we use the Web Audio API's high-resolution clock. The scheduler runs every 25ms and schedules notes 100ms ahead, ensuring rock-solid timing even under load.
- **Synthesized Sounds**: To avoid external dependencies on audio files, drum sounds are synthesized using oscillators:
  - Kick: 60Hz sine wave, 0.5s decay
  - Snare: 200Hz, 0.3s decay
  - Hi-hat: 800Hz, 0.1s decay (high frequency noise approximation)
  - Clap: 150Hz, 0.2s decay
- **Graceful Degradation**: The `loadSample()` function is available for loading real drum samples when they're available.

### State Management

- **Separate Hooks**: Audio, sequencer, and turn logic are separated into focused hooks for better maintainability and testability.
- **Functional Updates**: All state updates use functional form to avoid stale closure issues.
- **Refs for Mutable Values**: Audio timing variables (nextNoteTime, currentStep, timerID) use refs to avoid re-renders during playback.

### Component Structure

- **Composition Pattern**: Grid → InstrumentRow → Step hierarchy allows for flexible layout changes
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

- Pattern management (undo/redo, pattern history)
- Velocity controls in the UI
- Extended patterns (32/64 steps)
- Visual playhead improvements
- Better synthesized drum sounds (noise buffers for snare/hat)

## Code Quality

- ✅ TypeScript strict mode compatible
- ✅ ESLint passing
- ✅ React hooks rules followed
- ✅ No console errors
- ✅ Responsive design
- ✅ Accessible button labels
