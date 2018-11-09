/*
sig tree is expecting a tree that looks like:

{
    <PubKeyHex>:[[<PubKeyHex, SigHex>], [<PubKeyHex, SigHex>]...]
    <PubKeyHex>:[[<PubKeyHex, SigHex>], [<PubKeyHex, SigHex>]...]
}


*/

class SigTree {
  constructor(sigController, tree, certificate) {
    this.sigController = sigController;
    this.tree = tree;
    this.cleanedTree = {};
    this.processedKeys = [];
    this.certificate = certificate;
  }

  addToCleanTree(signer, recipient) {
    if (!this.cleanedTree[signer]) {
      this.cleanedTree[signer] = [recipient];
    } else {
      this.cleanedTree[signer].push(recipient);
    }
  }

  async validateBranch(signerHex, finalTarget) {
    if (this.processedKeys.includes(signerHex)) {
      return true;
    }
    let recipients = this.tree[signerHex];
    let signer = hexToBytes(signerHex);
    let subBranches = await Promise.all(
      recipients.map(async recipient => {
        let data = await hashData(this.certificate + recipient[0]);
        let signature = hexToBytes(recipient[1]);
        let signatureValid = await SignatureController.verifyElse(
          data,
          signature,
          signer
        );

        if (!signatureValid) {
          return false;
        } else {
          this.addToCleanTree(signerHex, recipient[0]);
          if (recipient[0] == finalTarget) {
            return true;
          } else {
            return await this.validateBranch(recipient[0], finalTarget);
          }
        }
      })
    );
    return !subBranches.includes(false);
  }

  // Verifies that the tree attached to a signed certificate is valid, used when receiving a new certificat
  async validateReceivedCertificate(signerHex, signatureHex) {
    // First verify the certificate
    let thisKeyHex = await this.sigController.exportPub();
    let data = await hashData(this.certificate + thisKeyHex);
    let signer = hexToBytes(signerHex);
    let signature = hexToBytes(signatureHex);
    let signatureValid = await SignatureController.verifyElse(
      data,
      signature,
      signer
    );

    if (signatureValid) {
      let signers = Object.keys(this.tree);
      for (let i = 0; i < signers.length; i++) {
        if (this.processedKeys.includes(signers[i])) {
          continue;
        }
        let validBranch = await this.validateBranch(signers[i], signerHex);
        console.log("bas");
        if (!validBranch) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  addSig(signerHex, receiver, signatureHex) {
    if (!this.tree[signerHex].includes([receiver, signatureHex])) {
      this.tree[signerHex].push([receiver, signatureHex]);
    }
  }

  // Verifies that the signatures in the provided tree all originiate with this one, used when verfying someones certificate
  async verifiyCertificateTree(proverKey) {
    let owner = await this.sigController.exportPub();
    let validation = await this.validateBranch(owner, proverKey);
    return validation;
  }
}
