#include <stdio.h>
#include <time.h>
#include <stdlib.h>
#include "falcon_c/falcon.h"

const unsigned NEAR_FALCON_DEGREE = 9;


size_t falconjs_public_key_bytes () {
	return FALCON_PUBKEY_SIZE(NEAR_FALCON_DEGREE);
}

size_t falconjs_secret_key_bytes () {
	return FALCON_PRIVKEY_SIZE(NEAR_FALCON_DEGREE);
}

size_t falconjs_signature_bytes () {
	return FALCON_SIG_PADDED_SIZE(NEAR_FALCON_DEGREE);
}

size_t falconjs_tmpsize_keygen() {
	return FALCON_TMPSIZE_KEYGEN(NEAR_FALCON_DEGREE);
}

size_t falconjs_tmpsize_makepub() {
	return FALCON_TMPSIZE_MAKEPUB(NEAR_FALCON_DEGREE);
}

size_t falconjs_tmpsize_signdyn() {
	return FALCON_TMPSIZE_SIGNDYN(NEAR_FALCON_DEGREE);
}

size_t falconjs_tmpsize_verify() {
	return FALCON_TMPSIZE_VERIFY(NEAR_FALCON_DEGREE);
}

void shake_256_from_seed(shake256_context *sc, const void *seed, size_t seed_len) {
	shake256_init_prng_from_seed(sc, seed, seed_len);
}

long falconjs_keypair (
	uint8_t* public_key,
	uint8_t* private_key,
	uint8_t* tmp,
	uint8_t* seed,
	int seed_size
) {
	shake256_context shake_context;
	shake256_init_prng_from_seed(&shake_context, seed, seed_size);
	int status = falcon_keygen_make(
		&shake_context,
		NEAR_FALCON_DEGREE,
		private_key,
		falconjs_secret_key_bytes(),
		public_key,
		falconjs_public_key_bytes(),
		tmp,
		falconjs_tmpsize_keygen()
	);
	return status;
}

long falconjs_pubkey(
	uint8_t* public_key,
	uint8_t* private_key,
	uint8_t* tmp
) {
	return falcon_make_public(
		public_key,
		falconjs_public_key_bytes(),
		private_key,
		falconjs_secret_key_bytes(),
		tmp,
		falconjs_tmpsize_makepub()
	);
}

long falconjs_sign (
	uint8_t* sig,
	const uint8_t* m,
	unsigned long mlen,
	const uint8_t* sk,
	uint8_t* tmp,
	uint8_t* seed,
	int seed_size
) {
	shake256_context shake_context;
	shake256_init_prng_from_seed(&shake_context, seed, seed_size);
	size_t sig_bytes = falconjs_signature_bytes();
	int status = falcon_sign_dyn(
		&shake_context,
		sig,
		&sig_bytes,
		FALCON_SIG_PADDED,
		sk,
		falconjs_secret_key_bytes(),
		m,
		mlen,
		tmp,
		falconjs_tmpsize_signdyn()
	);
	return status;
}

long falconjs_verify (
	const uint8_t* m,
	unsigned long mlen,
	const uint8_t* sig,
	const uint8_t* pk,
	uint8_t* tmp
) {
	return falcon_verify(
		sig,
		falconjs_signature_bytes(),
		FALCON_SIG_PADDED,
		pk,
		falconjs_public_key_bytes(),
		m,
		mlen,
		tmp,
		falconjs_tmpsize_verify()
	);
}