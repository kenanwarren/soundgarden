#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EMCC="${EMCC:-/opt/homebrew/opt/emscripten/bin/emcc}"

"$EMCC" "$SCRIPT_DIR/nam-kernel.c" \
  -O3 \
  -msimd128 \
  -s STANDALONE_WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=8388608 \
  -s MAXIMUM_MEMORY=67108864 \
  --no-entry \
  -Wl,--export=malloc \
  -Wl,--export=free \
  -Wl,--export=init_wavenet \
  -Wl,--export=wavenet_forward \
  -Wl,--export=init_lstm \
  -Wl,--export=lstm_forward \
  -Wl,--export=free_model \
  -o "$SCRIPT_DIR/nam-kernel.wasm"

echo "Built nam-kernel.wasm ($(wc -c < "$SCRIPT_DIR/nam-kernel.wasm") bytes)"
