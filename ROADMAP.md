# Multiplayer Beats - Frontend Roadmap

A collaborative beat-making app where two users alternate 60-second rounds to build a track together on a MIDI-style grid.

---

## Overview

**Core Concept**: Two users connect, take turns adding notes to a shared sequencer grid. Each turn lasts 60 seconds. The collaboration continues round after round until the beat is complete.

**Tech Stack**:

- React 19 + React Router 7
- TypeScript
- Tailwind CSS 4
- Web Audio API + Web MIDI API
- WebSocket for real-time sync

---

## Phase 1: Foundation (Week 1-2)

### Core Audio Engine

- [ ] Set up Web Audio API context
- [ ] Implement sample loading (kick, snare, hi-hat, etc.)
- [ ] Create audio scheduler for precise timing
- [ ] Add basic transport controls (play, pause, stop)

### State Management

- [ ] Design sequencer data structure (grid: steps × instruments)
- [ ] Create turn-based game state machine
- [ ] Implement timer logic (60-second countdown)

### Basic Routing

- [ ] `/` - Landing page with "Create Room" / "Join Room" options
- [ ] `/room/:roomId` - Main collaborative sequencer interface

---

## Phase 2: Sequencer Grid (Week 3-4)

### Grid Component

- [ ] Build 16-step × 8-instrument matrix (configurable)
- [ ] Visual styling inspired by FL Studio piano roll/step sequencer

### Playback System

- [ ] Visual playhead that moves across steps
- [ ] Real-time audio playback synchronized with visual
- [ ] BPM control (60-180 BPM)
- [ ] Loop playback

### Pattern Management

- [ ] Save/load pattern state
- [ ] Undo/redo for each turn
- [ ] Pattern history (view previous rounds)

---

## Phase 3: Multiplayer Sync (Week 5-6)

### Real-time Collaboration

- [ ] WebSocket connection management
- [ ] Broadcast note additions in real-time (during opponent's turn for preview)
- [ ] Sync transport state across clients
- [ ] Handle reconnection scenarios

### Turn-Based System

- [ ] Visual indicator of whose turn it is
- [ ] 60-second countdown timer with visual feedback
- [ ] Turn transition animation
- [ ] "Pass the Beat" button to end turn early

### Presence & Awareness

- [ ] Show opponent cursor position on grid
- [ ] Display user avatars/names
- [ ] Connection status indicators

---

## Key Technical Decisions

### Audio Timing

Use the Web Audio API's precise clock (AudioContext.currentTime) for scheduling, not setInterval. Implement a lookahead scheduler pattern for rock-solid timing.

### State Synchronization

- **Optimistic updates**: Show local changes immediately
- **CRDT approach**: Use simple last-write-wins for grid conflicts
- **Delta sync**: Only send changed notes, not entire grid

### Performance

- Canvas or CSS Grid? Start with CSS Grid for simplicity, profile at 32+ steps
- Virtualize instrument rows if supporting 20+ instruments
- Debounce rapid note entry to reduce sync traffic

---

## MVP Definition

The Minimum Viable Product includes:

1. 16-step × 4-instrument grid
2. Basic drum samples (kick, snare, hat, clap)
3. Two-player turn-based collaboration
4. 60-second timer with visual countdown
5. Real-time opponent cursor visibility
6. Play/stop and BPM control
7. Export as audio file
