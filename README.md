# Tonefield

**Note it's a bit rough around the edges right now, but I'm actively developing it and would love feedback!**

Desktop guitar practice app with real-time audio effects, a tuner, chord recognition, and interactive learning tools.

Built with Electron, React, TypeScript, Tailwind CSS, and the Web Audio API.

## Features

- **Tuner** - Real-time pitch detection with needle gauge, tuning presets (Standard, Drop D, DADGAD, etc.)
- **Effects Chain** - 23 AudioWorklet-based pedals: drives, EQ, modulation, reverb, delay, compressor, and more
- **NAM Capture** - Neural amp modeling via a custom C/WASM kernel
- **Chord Recognition** - Real-time detection via chromagram analysis
- **Metronome** - Adjustable BPM, time signature, accent
- **Scale Explorer** - 10 scale types on an interactive fretboard
- **Chord Library** - 80+ voicings with fingering diagrams
- **Rhythm Trainer** - 15+ patterns with timing accuracy grading and streak tracking
- **Ear Training** - Note and interval identification challenges

## Getting Started

```bash
npm install
npm run dev       # development with hot reload
npm run build     # production build
npm run dist      # create platform installers
```

The NAM WASM kernel requires Emscripten and is built automatically during `dev` and `build`.
