#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -n "${EMCC:-}" ]]; then
  EMCC_BIN="$EMCC"
elif command -v emcc >/dev/null 2>&1; then
  EMCC_BIN="$(command -v emcc)"
elif [[ -x "/opt/homebrew/opt/emscripten/bin/emcc" ]]; then
  EMCC_BIN="/opt/homebrew/opt/emscripten/bin/emcc"
else
  echo "Unable to find emcc. Set EMCC or install Emscripten." >&2
  exit 1
fi

"$EMCC_BIN" "$SCRIPT_DIR/nam-kernel.c" \
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
