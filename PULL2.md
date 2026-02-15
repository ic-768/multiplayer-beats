# Phase 2 Implementation: Real-Time Multiplayer Sync

This PR implements Phase 2 of the Multiplayer Beats roadmap, adding real-time synchronization between players using WebSockets.

## Summary

Players in the same room can now see each other's changes in real-time:

- Step toggles on the sequencer grid
- BPM changes
- Turn start/end, timer, and round updates
- Pattern clearing and game reset
- Player join/leave notifications

## Architecture

### Technology Stack

- **Socket.IO** - WebSocket library for real-time bidirectional communication
- **Express** - HTTP server for production
- **Vite Plugin** - Socket.IO injection during development

### Server Architecture

The server handles two modes:

1. **Development** (`npm run dev`)
   - Vite creates its own HTTP server
   - A Vite plugin (`socketIOPlugin`) attaches Socket.IO to it
   - The plugin is defined in `vite.config.ts`

2. **Production** (`npm run start`)
   - Custom Express server in `server/index.ts`
   - Creates its own Socket.IO instance
   - Serves static assets and delegates to React Router SSR

This separation allows:

- Seamless hot reloading in development
- Full control over the production server
- No difference in socket behavior between modes

### Room Management

- Rooms are identified by a 6-character room code
- Maximum 2 players per room
- Room state is stored in-memory on the server:
  - Sequencer steps (16 steps × 4 instruments)
  - Current BPM
  - Turn state (current player, time remaining, round)
  - Connected players

### Events

| Event             | Direction       | Description                           |
| ----------------- | --------------- | ------------------------------------- |
| `join-room`       | Client → Server | Player joins a room                   |
| `joined-room`     | Server → Client | Room state sent to joining player     |
| `player-joined`   | Server → Client | Notify existing players of new player |
| `toggle-step`     | Client → Server | Player toggles a step                 |
| `step-toggled`    | Server → Client | Broadcast step change                 |
| `set-bpm`         | Client → Server | Player changes BPM                    |
| `bpm-changed`     | Server → Client | Broadcast BPM change                  |
| `start-turn`      | Client → Server | Start a new turn                      |
| `turn-started`    | Server → Client | Broadcast turn start                  |
| `end-turn`        | Client → Server | End current turn                      |
| `turn-ended`      | Server → Client | Broadcast turn end                    |
| `reset-game`      | Client → Server | Reset entire game                     |
| `game-reset`      | Server → Client | Broadcast game reset                  |
| `clear-pattern`   | Client → Server | Clear all steps                       |
| `pattern-cleared` | Server → Client | Broadcast pattern clear               |
| `disconnect`      | Client → Server | Player disconnects                    |
| `player-left`     | Server → Client | Notify remaining players              |
| `room-full`       | Server → Client | Room already has 2 players            |

## Client Integration

### useSocket Hook

The `useSocket` hook (`app/hooks/useSocket.ts`) manages:

- Socket connection and disconnection
- Room state synchronization
- Event handlers for all server events
- Emit functions for client actions

### Room Page Integration

The room page (`app/routes/room.tsx`) uses the socket hook to:

- Join the room on mount
- Sync sequencer state from server
- Broadcast local changes to other players
- Handle turn management via socket

## Files Changed

### New Files

- `server/index.ts` - Production Express server with Socket.IO
- `server/socket.ts` - Socket.IO event handlers and room logic
- `app/hooks/useSocket.ts` - Client-side socket management hook

### Modified Files

- `vite.config.ts` - Added Socket.IO Vite plugin for development
- `app/routes/room.tsx` - Integrated socket for real-time sync
- `app/store/sequencer.ts` - Added `setStepsFromServer` for syncing server state

### Removed Files

- `app/utils/sequencer.ts` - Was unused (store has its own)

## How to Test

1. Start the dev server:

   ```bash
   npm run dev
   ```

2. Open http://localhost:5173 in two browser tabs/windows

3. Create a room in the first tab

4. Join the same room in the second tab using the room code

5. Test real-time sync:
   - Click steps in one tab, see them appear in the other
   - Change BPM, see it sync
   - Start a turn, see timer appear in both tabs
   - Watch turn alternate between players

## Production Build

```bash
npm run build
npm run start
```

The production server runs on port 3000.

## Known Limitations

- Room state is not persisted (in-memory only)
- No authentication or room passwords
- No reconnection handling (page refresh resets connection)
- Turn timer runs on server but clients manage their own display
- CORS allows all origins (should be restricted in production)
