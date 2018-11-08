function hexToBytes(hex) {
  var view = new Uint8Array(hex.length / 2);

  for (var i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }

  return view.buffer;
}

function buf2hex(buffer) {
  // buffer is an ArrayBuffer
  return Array.prototype.map
    .call(new Uint8Array(buffer), x => ("00" + x.toString(16)).slice(-2))
    .join("");
}

function hashData(str) {
  return window.crypto.subtle.digest(
    {
      name: "SHA-256"
    },
    new TextEncoder().encode(str)
  );
}
const TEST_CERT = "HUMAN:MALE:NICE";

class SignatureController {
  constructor(privKey, pubKey) {
    this.privKey = privKey;
    this.pubKey = pubKey;
  }

  static async importKeys(privJWK, pubHex) {
    let privKey = await window.crypto.subtle.importKey(
      "jwk",
      privJWK,
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      false,
      ["sign"]
    );
    let publicKey = await window.crypto.subtle.importKey(
      "spki",
      hexToBytes(pubHex),
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      true,
      ["verify"]
    );
    return new SignatureController(privKey, publicKey);
  }

  static async generateKeys() {
    let key = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      true,
      ["sign", "verify"]
    );

    let privKey = await window.crypto.subtle.exportKey("jwk", key.privateKey);

    let pubKey = await window.crypto.subtle.exportKey("spki", key.publicKey);
    return [privKey, buf2hex(pubKey)];
  }

  exportPub() {
    return window.crypto.subtle.exportKey("spki", this.pubKey).then(buf2hex);
  }

  sign(data) {
    return window.crypto.subtle
      .sign(
        {
          name: "ECDSA",
          hash: { name: "SHA-256" }
        },
        this.privKey,
        data
      )
      .then(buf2hex);
  }

  verifySelf(data, signature) {
    return window.crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" } //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
      },
      this.pubKey,
      signature,
      data
    );
  }

  static async verifyElse(data, signature, signerBytes) {
    let signer = await window.crypto.subtle.importKey(
      "spki",
      signerBytes,
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      true,
      ["verify"]
    );

    return window.crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" }
      },
      signer,
      signature,
      data
    );
  }
}

var sigCont;
var pubKey;
var sig;

SignatureController.generateKeys()
  .then(keys =>
    SignatureController.importKeys(keys[0], keys[1]).then(co => {
      sigCont = co;
    })
  )
  .then(() => {
    sigCont
      .exportPub()
      .then(pub => {
        pubKey = pub;
      })
      .then(() => {
        hashData(TEST_CERT + pubKey).then(hash =>
          sigCont.sign(hash).then(sign => {
            sig = sign;
          })
        );
      });
  });
