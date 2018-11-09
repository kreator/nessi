function hexToBytes(hex) {
  var view = new Uint8Array(hex.length / 2);

  for (var i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }

  return view.buffer;
}

function bytesToHex(buffer) {
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
    return [privKey, bytesToHex(pubKey)];
  }

  exportPub() {
    return window.crypto.subtle.exportKey("spki", this.pubKey).then(bytesToHex);
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
      .then(bytesToHex);
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