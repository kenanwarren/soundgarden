#include <wasm_simd128.h>

#define EXPORT __attribute__((visibility("default")))

// Use standard allocator from emscripten
#include <stdlib.h>
#include <string.h>

// --- Fast math ---

static inline float fast_tanh(float x) {
  if (x > 4.97f) return 1.0f;
  if (x < -4.97f) return -1.0f;
  float x2 = x * x;
  return x * (27.0f + x2) / (27.0f + 9.0f * x2);
}

static inline float fast_sigmoid(float x) {
  float hx = x * 0.5f;
  if (hx > 4.97f) return 1.0f;
  if (hx < -4.97f) return 0.0f;
  float x2 = hx * hx;
  return 0.5f + 0.5f * hx * (27.0f + x2) / (27.0f + 9.0f * x2);
}

static inline v128_t simd_fast_tanh(v128_t x) {
  v128_t pos_clamp = wasm_f32x4_const(4.97f, 4.97f, 4.97f, 4.97f);
  v128_t neg_clamp = wasm_f32x4_const(-4.97f, -4.97f, -4.97f, -4.97f);
  v128_t one = wasm_f32x4_const(1.0f, 1.0f, 1.0f, 1.0f);
  v128_t neg_one = wasm_f32x4_const(-1.0f, -1.0f, -1.0f, -1.0f);
  v128_t c27 = wasm_f32x4_const(27.0f, 27.0f, 27.0f, 27.0f);
  v128_t c9 = wasm_f32x4_const(9.0f, 9.0f, 9.0f, 9.0f);

  v128_t x2 = wasm_f32x4_mul(x, x);
  v128_t num = wasm_f32x4_mul(x, wasm_f32x4_add(c27, x2));
  v128_t den = wasm_f32x4_add(c27, wasm_f32x4_mul(c9, x2));
  v128_t result = wasm_f32x4_div(num, den);

  result = wasm_v128_bitselect(one, result, wasm_f32x4_gt(x, pos_clamp));
  result = wasm_v128_bitselect(neg_one, result, wasm_f32x4_lt(x, neg_clamp));
  return result;
}

static inline v128_t simd_fast_sigmoid(v128_t x) {
  v128_t half = wasm_f32x4_const(0.5f, 0.5f, 0.5f, 0.5f);
  v128_t hx = wasm_f32x4_mul(x, half);
  v128_t t = simd_fast_tanh(hx);
  return wasm_f32x4_add(half, wasm_f32x4_mul(half, t));
}

// --- SIMD dot product for ch-sized vectors (multiples of 4) ---

static inline float dot_simd(const float* a, const float* b, int n) {
  v128_t sum = wasm_f32x4_const(0, 0, 0, 0);
  for (int i = 0; i < n; i += 4) {
    v128_t va = wasm_v128_load(a + i);
    v128_t vb = wasm_v128_load(b + i);
    sum = wasm_f32x4_add(sum, wasm_f32x4_mul(va, vb));
  }
  float tmp[4];
  wasm_v128_store(tmp, sum);
  return tmp[0] + tmp[1] + tmp[2] + tmp[3];
}

static inline int next_pow2(int v) {
  v--; v |= v >> 1; v |= v >> 2; v |= v >> 4; v |= v >> 8; v |= v >> 16; return v + 1;
}

// --- WaveNet structures ---

typedef struct {
  float* bias;     // [co]
  float* mW;       // [ch * ch]
  float* mB;       // [ch]
  float* buf;      // [bs_pow2 * ch]
  float* flatKernel; // [ks * co * ch]
  int* tapDilations; // [ks]
  int bi;
  int bs;          // power of 2
  int bMask;
  int ks;
  int ch;
  int co;
} WaveNetLayer;

typedef struct {
  int inSize;
  int ch;
  int co;
  int ks;
  int gated;
  int headSize;
  float* rW;       // [inSize * ch]
  WaveNetLayer* layers;
  int numLayers;
  float* hW;       // [ch * headSize]
  float* hB;       // [headSize] or NULL
  float* x;        // [ch]
  float* cv;       // [co]
} WaveNetBlock;

typedef struct {
  WaveNetBlock* blocks;
  int numBlocks;
  float headScale;
} WaveNetModel;

// --- LSTM structures ---

typedef struct {
  float* Wi;       // [4*hs * is]
  float* Wh;       // [4*hs * hs]
  float* bias;     // [4*hs]
  float* h;        // [hs]
  float* c;        // [hs]
  int inputSize;
} LSTMLayer;

typedef struct {
  LSTMLayer* layers;
  int numLayers;
  int hiddenSize;
  float* hW;       // [hs]
  float* hB;       // [1]
  float* gates;    // [4*hs]
} LSTMModel;

// --- Helpers ---

static float* alloc_floats(int n) {
  return (float*)malloc(n * sizeof(float));
}

static int* alloc_ints(int n) {
  return (int*)malloc(n * sizeof(int));
}

static void zero_floats(float* dst, int n) {
  memset(dst, 0, n * sizeof(float));
}

// --- WaveNet init ---

EXPORT void* init_wavenet(
  const int* blockInfo, int numBlocks,
  const int* dilationsArr, const int* condSizes,
  const float* weights, int numWeights,
  float conditionValue, float headScale
) {
  WaveNetModel* model = (WaveNetModel*)malloc(sizeof(WaveNetModel));
  model->numBlocks = numBlocks;
  model->headScale = headScale;
  model->blocks = (WaveNetBlock*)malloc(numBlocks * sizeof(WaveNetBlock));

  int wpos = 0;
  int dpos = 0;

  for (int b = 0; b < numBlocks; b++) {
    int inSize = blockInfo[b * 7 + 0];
    int ch = blockInfo[b * 7 + 1];
    int ks = blockInfo[b * 7 + 2];
    int numLayers = blockInfo[b * 7 + 3];
    int headSize = blockInfo[b * 7 + 4];
    int gated = blockInfo[b * 7 + 5];
    int headBias = blockInfo[b * 7 + 6];
    int condSize = condSizes[b];
    int co = gated ? 2 * ch : ch;

    // Pad ch to multiple of 4 for SIMD alignment
    int chPad = (ch + 3) & ~3;
    int coPad = (co + 3) & ~3;

    WaveNetBlock* blk = &model->blocks[b];
    blk->inSize = inSize;
    blk->ch = ch;
    blk->co = co;
    blk->ks = ks;
    blk->gated = gated;
    blk->headSize = headSize;
    blk->numLayers = numLayers;
    blk->x = alloc_floats(chPad);
    blk->cv = alloc_floats(coPad);
    zero_floats(blk->x, chPad);
    zero_floats(blk->cv, coPad);

    // Rechannel weights
    blk->rW = alloc_floats(inSize * chPad);
    zero_floats(blk->rW, inSize * chPad);
    for (int i = 0; i < inSize * ch; i++) blk->rW[i] = weights[wpos++];

    blk->layers = (WaveNetLayer*)malloc(numLayers * sizeof(WaveNetLayer));

    for (int l = 0; l < numLayers; l++) {
      int d = dilationsArr[dpos++];
      int bs = d * (ks - 1) + 1;
      int bsPow2 = next_pow2(bs);
      int bMask = bsPow2 - 1;

      WaveNetLayer* ly = &blk->layers[l];
      ly->bi = 0;
      ly->bs = bsPow2;
      ly->bMask = bMask;
      ly->ks = ks;
      ly->ch = ch;
      ly->co = co;

      // Conv weights: read [ch * co * ks], reformat to [ks * co * chPad]
      float* cW = alloc_floats(ch * co * ks);
      for (int i = 0; i < ch * co * ks; i++) cW[i] = weights[wpos++];
      float* cB = alloc_floats(co);
      for (int i = 0; i < co; i++) cB[i] = weights[wpos++];

      float* condW = 0;
      if (condSize > 0) {
        condW = alloc_floats(condSize * co);
        for (int i = 0; i < condSize * co; i++) condW[i] = weights[wpos++];
      }

      // Mixer weights
      ly->mW = alloc_floats(ch * chPad);
      zero_floats(ly->mW, ch * chPad);
      for (int o = 0; o < ch; o++)
        for (int c = 0; c < ch; c++)
          ly->mW[o * chPad + c] = weights[wpos++];

      ly->mB = alloc_floats(chPad);
      zero_floats(ly->mB, chPad);
      for (int i = 0; i < ch; i++) ly->mB[i] = weights[wpos++];

      // Reformat kernel to [ks * co * chPad] with SIMD padding
      ly->flatKernel = alloc_floats(ks * co * chPad);
      zero_floats(ly->flatKernel, ks * co * chPad);
      for (int k = 0; k < ks; k++) {
        for (int o = 0; o < co; o++) {
          int srcBase = o * ch * ks;
          int dstBase = k * co * chPad + o * chPad;
          for (int c = 0; c < ch; c++) {
            ly->flatKernel[dstBase + c] = cW[srcBase + c * ks + k];
          }
        }
      }

      // Compute bias (fold in condition)
      ly->bias = alloc_floats(coPad);
      zero_floats(ly->bias, coPad);
      if (condW && condSize > 0) {
        if (condSize == 1) {
          for (int o = 0; o < co; o++) ly->bias[o] = cB[o] + condW[o] * conditionValue;
        } else {
          for (int o = 0; o < co; o++) {
            float v = cB[o];
            for (int ci = 0; ci < condSize; ci++) v += condW[ci * co + o] * conditionValue;
            ly->bias[o] = v;
          }
        }
      } else {
        for (int o = 0; o < co; o++) ly->bias[o] = cB[o];
      }

      ly->tapDilations = alloc_ints(ks);
      for (int k = 0; k < ks; k++) ly->tapDilations[k] = d * (ks - 1 - k);

      // Circular buffer with SIMD-padded channels
      ly->buf = alloc_floats(bsPow2 * chPad);
      zero_floats(ly->buf, bsPow2 * chPad);
    }

    // Head weights
    blk->hW = alloc_floats(chPad * headSize);
    zero_floats(blk->hW, chPad * headSize);
    for (int i = 0; i < ch * headSize; i++) blk->hW[i] = weights[wpos++];

    if (headBias) {
      blk->hB = alloc_floats(headSize);
      for (int i = 0; i < headSize; i++) blk->hB[i] = weights[wpos++];
    } else {
      blk->hB = 0;
    }
  }

  return model;
}

// --- WaveNet forward ---

EXPORT void wavenet_forward(
  void* modelPtr, float* inBuf, float* outBuf,
  int numFrames, float inGain, float outGain
) {
  WaveNetModel* model = (WaveNetModel*)modelPtr;
  int numBlocks = model->numBlocks;
  float headScale = model->headScale;

  for (int i = 0; i < numFrames; i++) {
    float sample = inBuf[i] * inGain;
    float* ph = 0;

    for (int b = 0; b < numBlocks; b++) {
      WaveNetBlock* blk = &model->blocks[b];
      int ch = blk->ch;
      int co = blk->co;
      int chPad = (ch + 3) & ~3;
      float* x = blk->x;
      float* cv = blk->cv;
      float* rW = blk->rW;

      // Rechannel
      if (blk->inSize == 1) {
        v128_t vs = wasm_f32x4_splat(sample);
        for (int c = 0; c < chPad; c += 4) {
          v128_t vr = wasm_v128_load(rW + c);
          wasm_v128_store(x + c, wasm_f32x4_mul(vs, vr));
        }
      } else {
        int inSz = blk->inSize;
        for (int c = 0; c < ch; c++) {
          float v = 0;
          int rwBase = c * inSz;
          for (int j = 0; j < inSz; j++) v += ph[j] * rW[rwBase + j];
          x[c] = v;
        }
      }

      // Process layers
      for (int l = 0; l < blk->numLayers; l++) {
        WaveNetLayer* ly = &blk->layers[l];
        int bi = ly->bi;
        float* buf = ly->buf;
        int frameBase = bi * chPad;
        float* bias = ly->bias;
        float* mW = ly->mW;
        float* mB = ly->mB;
        int lks = ly->ks;
        int lco = ly->co;
        float* fk = ly->flatKernel;
        int bMask = ly->bMask;

        // Write current x to circular buffer
        for (int c = 0; c < chPad; c += 4) {
          wasm_v128_store(buf + frameBase + c, wasm_v128_load(x + c));
        }

        // Init cv with bias
        int coPad = (lco + 3) & ~3;
        for (int o = 0; o < coPad; o += 4) {
          wasm_v128_store(cv + o, wasm_v128_load(bias + o));
        }

        // Convolution
        if (lks == 3) {
          int t0 = ((bi - ly->tapDilations[0]) & bMask) * chPad;
          int t1 = ((bi - ly->tapDilations[1]) & bMask) * chPad;
          int t2 = ((bi - ly->tapDilations[2]) & bMask) * chPad;
          int fk1off = lco * chPad;
          int fk2off = 2 * lco * chPad;

          for (int o = 0; o < lco; o++) {
            int off0 = o * chPad;
            int off1 = fk1off + o * chPad;
            int off2 = fk2off + o * chPad;
            v128_t sum = wasm_f32x4_const(0, 0, 0, 0);
            for (int c = 0; c < chPad; c += 4) {
              v128_t b0 = wasm_v128_load(buf + t0 + c);
              v128_t b1 = wasm_v128_load(buf + t1 + c);
              v128_t b2 = wasm_v128_load(buf + t2 + c);
              v128_t k0 = wasm_v128_load(fk + off0 + c);
              v128_t k1 = wasm_v128_load(fk + off1 + c);
              v128_t k2 = wasm_v128_load(fk + off2 + c);
              sum = wasm_f32x4_add(sum, wasm_f32x4_mul(k0, b0));
              sum = wasm_f32x4_add(sum, wasm_f32x4_mul(k1, b1));
              sum = wasm_f32x4_add(sum, wasm_f32x4_mul(k2, b2));
            }
            float tmp[4];
            wasm_v128_store(tmp, sum);
            cv[o] += tmp[0] + tmp[1] + tmp[2] + tmp[3];
          }
        } else {
          for (int k = 0; k < lks; k++) {
            int bO = ((bi - ly->tapDilations[k]) & bMask) * chPad;
            int fkBase = k * lco * chPad;
            for (int o = 0; o < lco; o++) {
              cv[o] += dot_simd(fk + fkBase + o * chPad, buf + bO, chPad);
            }
          }
        }

        // Activation
        if (blk->gated) {
          for (int c = 0; c < ch; c++) {
            cv[c] = fast_tanh(cv[c]) * fast_sigmoid(cv[c + ch]);
          }
        } else {
          // Process 4 at a time with SIMD tanh
          int c = 0;
          for (; c + 3 < lco; c += 4) {
            v128_t v = wasm_v128_load(cv + c);
            wasm_v128_store(cv + c, simd_fast_tanh(v));
          }
          for (; c < lco; c++) {
            cv[c] = fast_tanh(cv[c]);
          }
        }

        // Mixing: x[o] = mB[o] + sum(mW[o,c] * cv[c]) + buf[frameBase+o] (residual)
        for (int o = 0; o < ch; o++) {
          float v = mB[o] + dot_simd(mW + o * chPad, cv, chPad) + buf[frameBase + o];
          x[o] = v;
        }

        ly->bi = (bi + 1) & bMask;
      }

      ph = x;
      if (blk->headSize == 1) {
        float v = blk->hB ? blk->hB[0] : 0.0f;
        v += dot_simd(blk->hW, x, chPad);
        sample = v;
      }
    }

    float s = sample * headScale * outGain;
    outBuf[i] = (s != s) ? 0.0f : s; // NaN check
  }
}

// --- LSTM init ---

EXPORT void* init_lstm(
  int inputSize, int hiddenSize, int numLayers,
  const float* weights, int numWeights
) {
  LSTMModel* model = (LSTMModel*)malloc(sizeof(LSTMModel));
  model->numLayers = numLayers;
  model->hiddenSize = hiddenSize;
  int hs = hiddenSize;
  int hs4 = 4 * hs;
  int hsPad = (hs + 3) & ~3;
  int hs4Pad = (hs4 + 3) & ~3;

  model->layers = (LSTMLayer*)malloc(numLayers * sizeof(LSTMLayer));
  model->gates = alloc_floats(hs4Pad);
  zero_floats(model->gates, hs4Pad);

  int wpos = 0;

  for (int l = 0; l < numLayers; l++) {
    int is = (l == 0) ? inputSize : hs;
    LSTMLayer* ly = &model->layers[l];
    ly->inputSize = is;

    ly->Wi = alloc_floats(hs4 * is);
    for (int i = 0; i < hs4 * is; i++) ly->Wi[i] = weights[wpos++];

    ly->Wh = alloc_floats(hs4 * hsPad);
    zero_floats(ly->Wh, hs4 * hsPad);
    for (int g = 0; g < hs4; g++)
      for (int j = 0; j < hs; j++)
        ly->Wh[g * hsPad + j] = weights[wpos++];

    // Merge biasIH + biasHH
    float* biasIH = alloc_floats(hs4);
    for (int i = 0; i < hs4; i++) biasIH[i] = weights[wpos++];
    float* biasHH = alloc_floats(hs4);
    for (int i = 0; i < hs4; i++) biasHH[i] = weights[wpos++];

    ly->bias = alloc_floats(hs4Pad);
    zero_floats(ly->bias, hs4Pad);
    for (int i = 0; i < hs4; i++) ly->bias[i] = biasIH[i] + biasHH[i];

    ly->h = alloc_floats(hsPad);
    zero_floats(ly->h, hsPad);
    ly->c = alloc_floats(hsPad);
    zero_floats(ly->c, hsPad);
  }

  model->hW = alloc_floats(hsPad);
  zero_floats(model->hW, hsPad);
  for (int i = 0; i < hs; i++) model->hW[i] = weights[wpos++];

  model->hB = alloc_floats(1);
  model->hB[0] = weights[wpos++];

  return model;
}

// --- LSTM forward ---

EXPORT void lstm_forward(
  void* modelPtr, float* inBuf, float* outBuf,
  int numFrames, float inGain, float outGain
) {
  LSTMModel* model = (LSTMModel*)modelPtr;
  int nl = model->numLayers;
  int hs = model->hiddenSize;
  int hs4 = 4 * hs;
  int hsPad = (hs + 3) & ~3;
  float* gates = model->gates;

  for (int i = 0; i < numFrames; i++) {
    float inpVal = inBuf[i] * inGain;
    float* inp = 0;
    int inpLen = 1;

    for (int l = 0; l < nl; l++) {
      LSTMLayer* ly = &model->layers[l];
      int lyIs = ly->inputSize;
      float* lyWi = ly->Wi;
      float* lyWh = ly->Wh;
      float* lyBias = ly->bias;
      float* lyH = ly->h;
      float* lyC = ly->c;

      // Gate computation
      for (int g = 0; g < hs4; g++) {
        float v = lyBias[g];
        if (inpLen == 1) {
          v += lyWi[g] * inpVal;
        } else {
          int wiBase = g * lyIs;
          for (int j = 0; j < lyIs; j++) v += lyWi[wiBase + j] * inp[j];
        }
        v += dot_simd(lyWh + g * hsPad, lyH, hsPad);
        gates[g] = v;
      }

      // Cell/hidden update
      for (int j = 0; j < hs; j++) {
        float ig = fast_sigmoid(gates[j]);
        float fg = fast_sigmoid(gates[hs + j]);
        float gg = fast_tanh(gates[2 * hs + j]);
        float og = fast_sigmoid(gates[3 * hs + j]);
        lyC[j] = fg * lyC[j] + ig * gg;
        lyH[j] = og * fast_tanh(lyC[j]);
      }

      inp = lyH;
      inpLen = hs;
      inpVal = 0;
    }

    float out = model->hB[0];
    out += dot_simd(model->hW, inp, hsPad);
    float s = out * outGain;
    outBuf[i] = (s != s) ? 0.0f : s;
  }
}

// --- Cleanup ---

EXPORT void free_model(void* modelPtr) {
  (void)modelPtr;
  // With bump allocator, individual frees are no-ops.
  // Call reset_allocator() to reclaim all memory.
}
