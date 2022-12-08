const nacl = require("tweetnacl");
const byteSize  = (str) => {
    let size = Buffer.from(str).length;
    return size;
  } 
var falcon	= (function () {
    var Module = require("../falcon_wrapper.js");

    const randomSeedSize = 64;

    function dataReturn (returnValue, result) {
        if (returnValue === 0) {
            return result;
        }
        else {
            throw new Error('Falcon error: ' + returnValue);
        }
    }

    function dataResult (buffer, byteLength) {
        return new Uint8Array(
            new Uint8Array(Module.HEAPU8.buffer, buffer, byteLength)
        );
    }

    function dataFree (buffer) {
        try {
            Module._free(buffer);
        }
        catch (err) {
            setTimeout(function () { throw err; }, 0);
        }
    }

    function malloc_status (malloc_ret) {
        if (malloc_ret == null){
            throw new Error('Malloc failed.');
        }
        return 0;
    }

    const publicKeyBytes = Module._falconjs_public_key_bytes();
    const privateKeyBytes = Module._falconjs_secret_key_bytes();
    const signatureBytes = Module._falconjs_signature_bytes();
    const tmpBytes_keygen = Module._falconjs_tmpsize_keygen();
    const tmpBytes_makepub = Module._falconjs_tmpsize_makepub();
    const tmpBytes_signdyn = Module._falconjs_tmpsize_signdyn();
    const tmpBytes_verify = Module._falconjs_tmpsize_verify();

    var falcon = {
        keyPair: function () {
            var seedValue = nacl.randomBytes(randomSeedSize);
            var publicKeyBuffer		= Module._malloc(publicKeyBytes);
            var privateKeyBuffer	= Module._malloc(privateKeyBytes);
            var tmpBuffer			= Module._malloc(tmpBytes_keygen);
            var seedBuffer          = Module._malloc(randomSeedSize);
            
            malloc_status(publicKeyBuffer);
            malloc_status(privateKeyBuffer);
            malloc_status(tmpBuffer);
            malloc_status(seedBuffer);

            Module.writeArrayToMemory(seedValue, seedBuffer);
            Module.writeArrayToMemory(seedValue, seedBuffer);
            
    
            try {
                var returnValue	= Module._falconjs_keypair(
                    publicKeyBuffer,
                    privateKeyBuffer,
                    tmpBuffer,
                    seedBuffer,
                    randomSeedSize
                );
    
                return dataReturn(returnValue, {
                    publicKey: dataResult(publicKeyBuffer, publicKeyBytes),
                    privateKey: dataResult(privateKeyBuffer, privateKeyBytes)
                });
            }
            finally {
                dataFree(publicKeyBuffer);
                dataFree(privateKeyBuffer);
                dataFree(tmpBuffer);
                dataFree(seedBuffer);
            }
        },
        keyPairFromSeed: function (seed) {
            var seedLen = byteSize(seed);

            var publicKeyBuffer		= Module._malloc(publicKeyBytes);
            var privateKeyBuffer	= Module._malloc(privateKeyBytes);
            var tmpBuffer			= Module._malloc(tmpBytes_keygen);
            var seedBuffer          = Module._malloc(seedLen);

            malloc_status(publicKeyBuffer);
            malloc_status(privateKeyBuffer);
            malloc_status(tmpBuffer);
            malloc_status(seedBuffer);
            
            Module.writeArrayToMemory(seed, seedBuffer);
    
            try {
                var returnValue	= Module._falconjs_keypair(
                    publicKeyBuffer,
                    privateKeyBuffer,
                    tmpBuffer,
                    seedBuffer,
                    seedLen
                );
    
                return dataReturn(returnValue, {
                    publicKey: dataResult(publicKeyBuffer, publicKeyBytes),
                    privateKey: dataResult(privateKeyBuffer, privateKeyBytes)
                });
            }
            finally {
                dataFree(publicKeyBuffer);
                dataFree(privateKeyBuffer);
                dataFree(tmpBuffer);
                dataFree(seedBuffer);
            }
        },
            
    
        pubKey: function (privateKey) {
            var publicKeyBuffer		= Module._malloc(publicKeyBytes);
            var privateKeyBuffer	= Module._malloc(privateKeyBytes);
            var tmpBuffer			= Module._malloc(tmpBytes_makepub);

            
            malloc_status(publicKeyBuffer);
            malloc_status(privateKeyBuffer);
            malloc_status(tmpBuffer);
            
    
            Module.writeArrayToMemory(privateKey, privateKeyBuffer);
    
            try {
                var returnValue	= Module._falconjs_pubkey(
                    publicKeyBuffer,
                    privateKeyBuffer,
                    tmpBuffer
                );
    
                return dataReturn(returnValue, 
                    dataResult(publicKeyBuffer, publicKeyBytes)
                );
            }
            finally {
                dataFree(publicKeyBuffer);
                dataFree(privateKeyBuffer);
                dataFree(tmpBuffer);
            }
        },
    
        sign: function (message, privateKey) {
            var signature = falcon.signDetached(message, privateKey);
            var signed	= new Uint8Array(signatureBytes + message.length);
            signed.set(signature);
            signed.set(message, signatureBytes);
            return signed;
        },
    
        signDetached: function (message, privateKey) {
            var seedValue = nacl.randomBytes(randomSeedSize);

            var signatureBuffer		= Module._malloc(signatureBytes);
            var messageBuffer		= Module._malloc(message.length);
            var privateKeyBuffer	= Module._malloc(privateKeyBytes);
            var tmpBuffer			= Module._malloc(tmpBytes_signdyn);
            var seedBuffer          = Module._malloc(randomSeedSize);

            malloc_status(signatureBuffer);
            malloc_status(messageBuffer);
            malloc_status(privateKeyBuffer);
            malloc_status(tmpBuffer);
            malloc_status(seedBuffer);
    
            Module.writeArrayToMemory(new Uint8Array(signatureBytes), signatureBuffer);
            Module.writeArrayToMemory(message, messageBuffer);
            Module.writeArrayToMemory(privateKey, privateKeyBuffer);
            Module.writeArrayToMemory(new Uint8Array(tmpBytes_signdyn), tmpBuffer);
            Module.writeArrayToMemory(seedValue, seedBuffer);
    
            try {
                var returnValue	= Module._falconjs_sign(
                    signatureBuffer,
                    messageBuffer,
                    message.length,
                    privateKeyBuffer,
                    tmpBuffer,
                    seedBuffer,
                    randomSeedSize
                );
    
                return dataReturn(returnValue, dataResult(signatureBuffer, signatureBytes));
            }
            finally {
                dataFree(signatureBuffer);
                dataFree(messageBuffer);
                dataFree(privateKeyBuffer);
                dataFree(tmpBuffer);
                dataFree(seedBuffer);
            }
        },
    
        open: function (signed, publicKey) { 
            var signature	= new Uint8Array(signed.buffer, signed.byteOffset, signatureBytes);
            var message		= new Uint8Array(
                signed.buffer,
                signed.byteOffset + signatureBytes,
                signed.length - signatureBytes
            );
    
            var isValid = falcon.verifyDetached(signature, message, publicKey);
            if (isValid) {
                return message;
            }
            else {
                throw new Error('Failed to open Falcon signed message.');
            }
        },
    
        verifyDetached: function (signature, message, publicKey) {
            var signatureBuffer	= Module._malloc(signatureBytes);
            var messageBuffer	= Module._malloc(message.length);
            var publicKeyBuffer	= Module._malloc(publicKeyBytes);
            var tmpBuffer		= Module._malloc(tmpBytes_verify);
            
            malloc_status(tmpBuffer);

            if(!malloc_status(signatureBuffer))
                Module.writeArrayToMemory(signature, signatureBuffer);
            if(!malloc_status(messageBuffer))
                Module.writeArrayToMemory(message, messageBuffer);
            if(!malloc_status(publicKeyBuffer))
                Module.writeArrayToMemory(publicKey, publicKeyBuffer);


            try {
                var returnValue	= Module._falconjs_verify(
                    messageBuffer,
                    message.length,
                    signatureBuffer,
                    publicKeyBuffer,
                    tmpBuffer
                );

                return returnValue === 0;
            }
            finally {
                dataFree(signatureBuffer);
                dataFree(messageBuffer);
                dataFree(publicKeyBuffer);
                dataFree(tmpBuffer);
            }
        }
    };

    return falcon;
}());

if (typeof module !== 'undefined' && module.exports) {
	falcon.falcon	= falcon;
	module.exports	= falcon;
}
else {
	self.falcon	= falcon;
}