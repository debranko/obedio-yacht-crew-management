#ifndef ADPCM_H
#define ADPCM_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief ADPCM encoder/decoder state
 *
 * Maintains the state needed for IMA ADPCM encoding and decoding.
 * Must be initialized before use and preserved between encode/decode calls.
 */
typedef struct {
    int16_t valprev;    // Previous output value
    int8_t index;       // Index into step size table
} adpcm_state_t;

/**
 * @brief Initialize ADPCM encoder/decoder state
 *
 * Must be called before encoding or decoding to initialize the state.
 *
 * @param state Pointer to ADPCM state structure
 */
void adpcm_encode_init(adpcm_state_t *state);

/**
 * @brief Encode 16-bit PCM samples to 4-bit ADPCM
 *
 * Encodes PCM samples using IMA ADPCM algorithm, achieving 4:1 compression.
 * Two 4-bit ADPCM samples are packed into each output byte (high nibble first).
 *
 * @param pcm_in Pointer to input PCM samples (16-bit signed)
 * @param adpcm_out Pointer to output ADPCM data buffer
 * @param samples Number of PCM samples to encode
 * @param state Pointer to encoder state (must be initialized)
 * @return size_t Number of bytes written to adpcm_out (samples/2)
 */
size_t adpcm_encode(int16_t *pcm_in, uint8_t *adpcm_out, size_t samples, adpcm_state_t *state);

/**
 * @brief Decode 4-bit ADPCM to 16-bit PCM samples
 *
 * Decodes ADPCM data back to PCM using IMA ADPCM algorithm.
 * Each input byte contains two 4-bit ADPCM samples (high nibble first).
 *
 * @param adpcm_in Pointer to input ADPCM data
 * @param pcm_out Pointer to output PCM samples buffer (16-bit signed)
 * @param samples Number of PCM samples to decode (must be even)
 * @param state Pointer to decoder state (must be initialized)
 * @return size_t Number of PCM samples decoded
 */
size_t adpcm_decode(uint8_t *adpcm_in, int16_t *pcm_out, size_t samples, adpcm_state_t *state);

/**
 * @brief Initialize ADPCM decoder state (alias for adpcm_encode_init)
 *
 * @param state Pointer to ADPCM state structure
 */
static inline void adpcm_decode_init(adpcm_state_t *state)
{
    adpcm_encode_init(state);
}

#ifdef __cplusplus
}
#endif

#endif // ADPCM_H
