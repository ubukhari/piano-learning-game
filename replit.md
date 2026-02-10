# Piano King - Piano Learning Game

## Overview
A browser-based piano learning game similar to Simply Piano, focused on teaching children to play "I Just Can't Wait to Be King" from The Lion King. Uses the microphone to listen to a real piano being played with Guitar Hero-style falling notes.

## Architecture
- **Frontend-only game logic**: All game mechanics run in the browser using Web Audio API
- **Pitch Detection**: Auto-correlation algorithm for monophonic pitch detection from microphone
- **Game Engine**: Manages game state, note timing, hit detection, and scoring
- **Song Charts**: Pre-defined note sequences for two difficulty levels

## Key Files
- `client/src/lib/pitchDetection.ts` - Microphone input and frequency-to-note conversion
- `client/src/lib/songCharts.ts` - Song note charts for Level 1 and Level 2
- `client/src/lib/gameEngine.ts` - Core game loop, hit detection, scoring
- `client/src/pages/menu.tsx` - Landing/level selection page
- `client/src/pages/play.tsx` - Main gameplay screen with falling notes

## Game Features
- Two difficulty levels (white keys only / with sharps & flats)
- Full song ~170 seconds with sections: INTRO, VERSE, CHORUS, VERSE, CHORUS, OUTRO
- Generous pitch tolerance for children
- Positive-only feedback, no fail states
- Streak tracking and score system

## Running
`npm run dev` starts the Express backend + Vite frontend on port 5000.
