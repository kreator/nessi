/*
sig tree is expecting a tree that looks like:

{
    <PubKeyHex>:[[<PubKeyHex, SigHex>], [<PubKeyHex, SigHex>]...]
    <PubKeyHex>:[[<PubKeyHex, SigHex>], [<PubKeyHex, SigHex>]...]
}


*/

class SigTree {
  constructor(sigController, tree) {
    this.sigController = sigController;
    this.tree = tree;
    this.processedKeys = [];
    this.validation = true;
  }

  async validateBranch(signerHex, certificate, finalTarget) {
    if (!this.validation) {
      return false;
    }
    if (this.processedKeys.includes(signerHex)) {
      return true;
    }
    let recipients = this.tree[signerHex];
    let signer = hexToBytes(signerHex);
    let subBranches = await Promise.all(
      recipients.map(recipient => {
        let data = await hashData(certificate + recipient[0]);
        let signature = hexToBytes(recipient[0]);
        let signatureValid = await SignatureController.verifyElse(
          data,
          signature,
          signer
        );
        if (!signatureValid) {
          this.validation = false;
        } else {
          await this.validateBranch(recipient[0], certificate, finalTarget);
        }
      })
    );
    return !subBranches.includes(false);
  }

  // Verifies that the tree attached to a signed certificate is valid, used when receiving a new certificat
  async validateReceivedCertificate(certificate, signerHex, signatureHex) {
    // First verify the certificate
    let thisKeyHex = await this.sigController.exportPub();
    let data = await hashData(certificate + thisKeyHex);
    let signer = hexToBytes(signerHex);
    let signature = hexToBytes(signatureHex);
    let signatureValid = await SignatureController.verifyElse(
      data,
      signature,
      signer
    );

    if (signatureValid) {
      let signers = Object.keys(this.tree);
      for (i = 0; i < signers.length; i++) {
        if (this.processedKeys.includes(signers[i])) {
          continue;
        }
        let validBranch = await this.validateBranch(
          signers[i],
          this.tree[signers[i]],
          certificate,
          signerHex
        );
        if (!validBranch) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  // Verifies that the signatures in the provided tree all originiate with this one, used when verfying someones certificate
  verifiyCertificateTree() {}
}
