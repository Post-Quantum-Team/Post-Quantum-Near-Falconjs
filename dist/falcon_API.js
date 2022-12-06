var falcon	= (function () {
    var Module = require("../falcon_wrapper.js");

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

    Module._initialize_random();
    var publicKeyBytes = Module._falconjs_public_key_bytes();
    var privateKeyBytes = Module._falconjs_secret_key_bytes();
    var bytes = Module._falconjs_signature_bytes();
    var tmpBytes_keygen = Module._falconjs_tmpsize_keygen();
    var tmpBytes_makepub = Module._falconjs_tmpsize_makepub();
    var tmpBytes_signdyn = Module._falconjs_tmpsize_signdyn();
    var tmpBytes_verify = Module._falconjs_tmpsize_verify();

    var falcon = {
        keyPair: function () {
            var publicKeyBuffer		= Module._malloc(publicKeyBytes);
            var privateKeyBuffer	= Module._malloc(privateKeyBytes);
            var tmpBuffer			= Module._malloc(tmpBytes_keygen);
    
            try {
                var returnValue	= Module._falconjs_keypair(
                    publicKeyBuffer,
                    privateKeyBuffer,
                    tmpBuffer
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
            }
        },
    
        pubKey: function (privateKey) {
            var publicKeyBuffer		= Module._malloc(publicKeyBytes);
            var privateKeyBuffer	= Module._malloc(privateKeyBytes);
            var tmpBuffer			= Module._malloc(tmpBytes_makepub);
    
            Module.writeArrayToMemory(privateKey, privateKeyBuffer);
    
            try {
                var returnValue	= Module._falconjs_pubkey(
                    publicKeyBuffer,
                    privateKeyBuffer,
                    tmpBuffer
                );
    
                return dataReturn(returnValue, {
                    publicKey: dataResult(publicKeyBuffer, publicKeyBytes)
                });
            }
            finally {
                dataFree(publicKeyBuffer);
                dataFree(privateKeyBuffer);
                dataFree(tmpBuffer);
            }
        },
    
        sign: function (message, privateKey) {
            var signature = falcon.signDetached(message, privateKey);
            var signed	= new Uint8Array(bytes + message.length);
            signed.set(signature);
            signed.set(message, bytes);
            return signed;
        },
    
        signDetached: function (message, privateKey) {
            var signatureBuffer		= Module._malloc(bytes);
            var messageBuffer		= Module._malloc(message.length);
            var privateKeyBuffer	= Module._malloc(privateKeyBytes);
            var tmpBuffer			= Module._malloc(tmpBytes_signdyn);
    
            Module.writeArrayToMemory(new Uint8Array(bytes), signatureBuffer);
            Module.writeArrayToMemory(message, messageBuffer);
            Module.writeArrayToMemory(privateKey, privateKeyBuffer);
            Module.writeArrayToMemory(new Uint8Array(tmpBytes_signdyn), tmpBuffer);
    
            try {
                var returnValue	= Module._falconjs_sign(
                    signatureBuffer,
                    messageBuffer,
                    message.length,
                    privateKeyBuffer,
                    tmpBuffer
                );
    
                return dataReturn(returnValue, dataResult(signatureBuffer, bytes));
            }
            finally {
                dataFree(signatureBuffer);
                dataFree(messageBuffer);
                dataFree(privateKeyBuffer);
                dataFree(tmpBuffer);
            }
        },
    
        open: function (signed, publicKey) { 
            var signature	= new Uint8Array(signed.buffer, signed.byteOffset, bytes);
            var message		= new Uint8Array(
                signed.buffer,
                signed.byteOffset + bytes,
                signed.length - bytes
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
            var signatureBuffer	= Module._malloc(bytes);
            var messageBuffer	= Module._malloc(message.length);
            var publicKeyBuffer	= Module._malloc(publicKeyBytes);
            var tmpBuffer		= Module._malloc(tmpBytes_verify);

            Module.writeArrayToMemory(signature, signatureBuffer);
            Module.writeArrayToMemory(message, messageBuffer);
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