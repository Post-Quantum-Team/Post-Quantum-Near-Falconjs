
const falcon_api = require('../dist/falcon_API');
const { sha256 } = require('js-sha256');

test('test signDetached and verifyDetached', async () => {
    const message = new Uint8Array(sha256.array('message'));
    const keypair = falcon_api.keyPair();
    let signature = falcon_api.signDetached(message, keypair.privateKey);
    expect(falcon_api.verifyDetached(signature, message, keypair.publicKey)).toBeTruthy();
});

test('test keypair from seed', async () => {
    //Falcon512
    const keyPair = falcon_api.keyPairFromSeed("this is a big seed !");
    console.log("Init from seed : ",keyPair);
    //Verification to add here
});

test('test make public key', async () => {
    const keypair = falcon_api.keyPair();
    const pubkey = falcon_api.pubKey(keypair.privateKey);
    for(let i = 0; i < pubkey.length; i++) {
        expect(keypair.publicKey[i] === pubkey[i]).toBeTruthy();
    }
    //expect(keypair.publicKey === pubkey).toBeTruthy();
    // toBeTruthy to add just before
});

test('test sign and open', async () => {
    const message = new Uint8Array(sha256.array('message'));
    const keypair = falcon_api.keyPair();
    let signature = falcon_api.sign(message, keypair.privateKey);
    expect(falcon_api.open(signature, keypair.publicKey)).toBeTruthy;

});

test('test fail verifyDetached', async () => {
    const message = new Uint8Array(sha256.array('message'));
    const keypair = falcon_api.keyPair();
    let signature = falcon_api.signDetached(message, keypair.privateKey);
    signature[12] = 0;
    expect(falcon_api.verifyDetached(signature, message, keypair.publicKey)).toBeFalsy();
});


test('test verify with recomputed pubkey', async () => {
    const message = new Uint8Array(sha256.array('message'));

    //Falcon512
    const keypair = falcon_api.keyPair();
    const pubkey = falcon_api.pubKey(keypair.privateKey);
    let signature = falcon_api.signDetached(message, keypair.privateKey);
    expect(falcon_api.verifyDetached(signature, message, pubkey)).toBeTruthy;
});
