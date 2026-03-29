# Soundgarden

**Note it's a bit rough around the edges right now, but I'm actively developing it and would love feedback!**

Desktop guitar practice app with real-time audio effects, a tuner, chord recognition, and interactive learning tools.

Built with Electron, React, TypeScript, Tailwind CSS, and the Web Audio API.

## Features

### Audio Tools

- **Tuner** - Real-time pitch detection with needle gauge, tuning presets (Standard, Drop D, DADGAD, etc.)
- **Effects Chain** - AudioWorklet-based pedals (drives, modulation, delay, compressor, etc.) plus EQ, reverb, and cabinet simulator
- **NAM Capture** - Neural amp modeling via a custom C/WASM kernel
- **Chord Recognition** - Real-time detection via chromagram analysis
- **Metronome** - Adjustable BPM, time signature, accent

### Learning Tools

- **Scale Explorer** - Interactive fretboard with multiple scale types
- **Chord Library** - Voicings with fingering diagrams
- **Rhythm Trainer** - Patterns with timing accuracy grading and streak tracking
- **Ear Training** - Note and interval identification challenges
- **Chord Changes** - Practice switching between chords with timing feedback
- **Scale Sequences** - Practice scale patterns and melodic movement
- **Song Viewer** - Public domain songs with chord charts and lyrics

### Guided Practice

- Practice paths organized by genre: Blues, Rock, Pop, Funk, Country, Fingerstyle, and more
- Progress tracking across all learning modules
- Genre-specific tone and technique guidance

## Getting Started

```bash
npm install
npm run dev       # development with hot reload
npm run build     # production build
npm run dist      # create platform installers
```

The NAM WASM kernel requires Emscripten and is built automatically during `dev` and `build`.

## Development

```bash
npm run typecheck       # type checking
npm run lint            # linting
npm run format:check    # formatting check
npm test                # unit tests
npm run test:e2e        # end-to-end tests
```
