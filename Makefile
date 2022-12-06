all:
	bash -c ' \
		args="$$(echo " \
			--memory-init-file 0 \
			-s SINGLE_FILE=1 \
			-s TOTAL_MEMORY=16777216 -s TOTAL_STACK=8388608 \
			-s ASSERTIONS=0 \
			-s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
			-s ALIASING_FUNCTION_POINTERS=1 \
			-s DISABLE_EXCEPTION_CATCHING=1 \
			-s FORCE_FILESYSTEM=1 \
			-s BINARYEN_ASYNC_COMPILATION=0 \
			-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
			-Ifalcon_c \
			$$( \
				find \
					falcon_c/ \
				-name '"'"'*.c'"'"' -type f \
			) \
			falcon_wrapper.c \
			-s EXPORTED_RUNTIME_METHODS=\"[ \
				'"'"'writeArrayToMemory'"'"' \
			]\" \
			-s EXPORTED_FUNCTIONS=\"[ \
				'"'"'_free'"'"', \
				'"'"'_malloc'"'"', \
				'"'"'_initialize_random'"'"', \
				'"'"'_falconjs_keypair'"'"', \
				'"'"'_falconjs_pubkey'"'"', \
				'"'"'_falconjs_tmpsize_keygen'"'"', \
				'"'"'_falconjs_tmpsize_makepub'"'"', \
				'"'"'_falconjs_tmpsize_signdyn'"'"', \
				'"'"'_falconjs_tmpsize_verify'"'"', \
				'"'"'_falconjs_sign'"'"', \
				'"'"'_falconjs_verify'"'"', \
				'"'"'_falconjs_public_key_bytes'"'"', \
				'"'"'_falconjs_secret_key_bytes'"'"', \
				'"'"'_falconjs_signature_bytes'"'"' \
			]\" \
		" | perl -pe "s/\s+/ /g" | perl -pe "s/\[ /\[/g" | perl -pe "s/ \]/\]/g")"; \
		\
		bash -c "emcc $$args -o falcon_wrapper.js"; \
	'
