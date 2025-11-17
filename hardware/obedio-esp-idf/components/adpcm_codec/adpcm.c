#include "adpcm.h"
#include <string.h>

// IMA ADPCM step size table
static const int16_t step_table[89] = {
    7, 8, 9, 10, 11, 12, 13, 14, 16, 17,
    19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
    50, 55, 60, 66, 73, 80, 88, 97, 107, 118,
    130, 143, 157, 173, 190, 209, 230, 253, 279, 307,
    337, 371, 408, 449, 494, 544, 598, 658, 724, 796,
    876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066,
    2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
    5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
    15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767
};

// Index adjustment table
static const int8_t index_table[16] = {
    -1, -1, -1, -1, 2, 4, 6, 8,
    -1, -1, -1, -1, 2, 4, 6, 8
};

void adpcm_encode_init(adpcm_state_t *state)
{
    state->valprev = 0;
    state->index = 0;
}

/**
 * @brief Encode a single PCM sample to ADPCM
 *
 * @param sample Input PCM sample
 * @param state Encoder state
 * @return uint8_t 4-bit ADPCM code
 */
static uint8_t adpcm_encode_sample(int16_t sample, adpcm_state_t *state)
{
    int16_t step = step_table[state->index];
    int32_t diff = sample - state->valprev;
    uint8_t code = 0;

    // Store sign bit
    if (diff < 0) {
        code = 8;
        diff = -diff;
    }

    // Quantize the difference
    int32_t vpdiff = step >> 3;

    if (diff >= step) {
        code |= 4;
        diff -= step;
        vpdiff += step;
    }
    step >>= 1;

    if (diff >= step) {
        code |= 2;
        diff -= step;
        vpdiff += step;
    }
    step >>= 1;

    if (diff >= step) {
        code |= 1;
        vpdiff += step;
    }

    // Update previous value
    int32_t new_val = state->valprev;
    if (code & 8) {
        new_val -= vpdiff;
    } else {
        new_val += vpdiff;
    }

    // Clamp to 16-bit range
    if (new_val > 32767) {
        new_val = 32767;
    } else if (new_val < -32768) {
        new_val = -32768;
    }
    state->valprev = (int16_t)new_val;

    // Update step index
    state->index += index_table[code];
    if (state->index < 0) {
        state->index = 0;
    } else if (state->index > 88) {
        state->index = 88;
    }

    return code;
}

/**
 * @brief Decode a single ADPCM sample to PCM
 *
 * @param code 4-bit ADPCM code
 * @param state Decoder state
 * @return int16_t Decoded PCM sample
 */
static int16_t adpcm_decode_sample(uint8_t code, adpcm_state_t *state)
{
    int16_t step = step_table[state->index];
    int32_t vpdiff = step >> 3;

    // Reconstruct difference
    if (code & 4) {
        vpdiff += step;
    }
    if (code & 2) {
        vpdiff += step >> 1;
    }
    if (code & 1) {
        vpdiff += step >> 2;
    }

    // Apply sign
    int32_t new_val = state->valprev;
    if (code & 8) {
        new_val -= vpdiff;
    } else {
        new_val += vpdiff;
    }

    // Clamp to 16-bit range
    if (new_val > 32767) {
        new_val = 32767;
    } else if (new_val < -32768) {
        new_val = -32768;
    }
    state->valprev = (int16_t)new_val;

    // Update step index
    state->index += index_table[code];
    if (state->index < 0) {
        state->index = 0;
    } else if (state->index > 88) {
        state->index = 88;
    }

    return state->valprev;
}

size_t adpcm_encode(int16_t *pcm_in, uint8_t *adpcm_out, size_t samples, adpcm_state_t *state)
{
    size_t out_bytes = 0;

    // Process samples in pairs (2 samples per byte)
    for (size_t i = 0; i < samples; i += 2) {
        uint8_t code1 = adpcm_encode_sample(pcm_in[i], state);

        uint8_t code2 = 0;
        if (i + 1 < samples) {
            code2 = adpcm_encode_sample(pcm_in[i + 1], state);
        }

        // Pack two 4-bit codes into one byte (high nibble first)
        adpcm_out[out_bytes++] = (code1 << 4) | (code2 & 0x0F);
    }

    return out_bytes;
}

size_t adpcm_decode(uint8_t *adpcm_in, int16_t *pcm_out, size_t samples, adpcm_state_t *state)
{
    size_t out_samples = 0;
    size_t in_bytes = (samples + 1) / 2; // Round up

    // Process each byte (contains 2 ADPCM samples)
    for (size_t i = 0; i < in_bytes; i++) {
        uint8_t byte = adpcm_in[i];

        // Decode high nibble (first sample)
        uint8_t code1 = (byte >> 4) & 0x0F;
        pcm_out[out_samples++] = adpcm_decode_sample(code1, state);

        // Decode low nibble (second sample) if we haven't reached the end
        if (out_samples < samples) {
            uint8_t code2 = byte & 0x0F;
            pcm_out[out_samples++] = adpcm_decode_sample(code2, state);
        }
    }

    return out_samples;
}
