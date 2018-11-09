var messageTypes = {
  REQUEST_CERTIFICATE: "REQUEST_CERTIFICATE",

  APPROVE_CERTIFICATE: "APPROVE_CERTIFICATE",

  REJECT_CERTIFICATE: "REJECT_CERTIFICATE",

  REQUEST_CERTIFICATE_VERIFICATION: "REQUEST_CERTIFICATE_VERIFICATION",

  REJECT_VERIFICIATION: "REJECT_VERIFICIATION",

  APPROVE_VERIFICATION: "APPROVE_VERIFICATION",

  ERROR: "ERROR"
};

function parseMessage(data) {
  return JSON.parse(data);
}

function getMessageType(msg) {
  return msg.messageType;
}

function getMessageData(msg) {
  return msg.messageData;
}

function handleMessageReceive(msg) {
  var messageType = getMessageType(msg);
  var messageData = getMessageData(msg);
  if (messageTypes.REQUEST_CERTIFICATE == messageType) {
    handleRequestCertificate(messageData);
  } else if (messageTypes.APPROVE_CERTIFICATE == messageType) {
    handleApproveCertificate(messageData);
  } else if (messageType.REJECT_CERTIFICATE == messageType) {
    handleRejectCertificate(messageData);
  } else if (messageTypes.REQUEST_CERTIFICATE_VERIFICATION == messageType) {
    handleRequestCertificateVerification(messageData);
  } else if (messageTypes.REJECT_VERIFICIATION == messageType) {
    handleRejectCertificateVerification(messageData);
  } else if (messageTypes.APPROVE_VERIFICATION == messageType) {
    handleApproveCertificateVerification(messageData);
  }
}

function handleRequestCertificate(msgData) {
  // other peer requested client to sign his cert
  // show him the options and according to his answer send an approve/reject message
  var certificate = msgData.requestCertificate.certificate;
  var certificateName = msgData.requestCertificate.certificateName;
  requestCertificatePopup(certificate, certificateName); //NATALY
}

/**
 * Signs certificate for peer and sends it
 * @param {str} certificate
 */
function sendSignedCertificate(certificate) {
  chrome.storage.sync.get(["keys", "sigTree"], function(result) {
    console.log(result);
    SignatureController.importKeys(
      result["keys"].privKey,
      result["keys"].pubKey
    ).then(sigCont => {
      hashData(certificate + result["keys"].pubKey).then(hashedData =>
        sigCont.sign(hashedData).then(signature =>
          sendMessage(APPROVE_CERTIFICATE, {
            //AVI
            signerKey: result["keys"].pubKey,
            signedCertificate: signature,
            certificate: certificate,
            signatureTree: result["sigTree"][certificate],
            approved: true
          })
        )
      );
    });
  });
}

function handleApproveCertificate(msgData) {
  // someone approved my certificate
  approveCertificate = msgData.approveCertificate;
  if (approveCertificate.approved) {
    // Fetch keys from storage
    chrome.storage.sync.get(["keys", "sigTree"], function(result) {
      // Create signer
      SignatureController.importKeys(
        result["keys"].privKey,
        result["keys"].pubKey
      ).then(sigCont => {
        // Create tree object
        var signatureTree = SigTree(
          sigCont,
          approveCertificate.signatureTree,
          approveCertificate.certificate
        );
        // Verify
        signatureTree
          .validateReceivedCertificate(
            approveCertificate.signerKey,
            approveCertificate.signedCertificate
          )
          .then(valid => {
            if (valid) {
              // Store if valid
              let tree = result["sigTree"];
              tree[approveCertificate.certificate] = deepmerge(
                tree[approveCertificate.certificate],
                approveCertificate.signatureTree
              );
              chrome.storage.sync.set({ sigTree: tree });
            } else {
              errorPopup("Failed to verify certificate source"); //NATALY
            }
          });
      });
    });
  }
}

function handleRejectCertificate(msgData) {
  // my REQUEST_CERTIFICATE got declined. what do?
  // NATALY error popup?
  sendMessage({ approved: false });
}

function handleRequestCertificateVerification(msgData) {
  // other peer sent me a {cert}. that means I need to decide if I want to prove myself to him or not
  // Display a (send certificate verification/ decline input box)
  console.log("received request certificate verification");
  var certificate = msgData.requestVerification.certificate;
  var certificateName = msgData.requestVerification.certificateName;
  requestVerificationPopup(certificate, certificateName); //NATALY
}

function sendVerification(certificate) {
  chrome.storage.sync.get(["keys", "sigTree"], function(result) {
    sendMessage({
      signatureTree: result.sigTree[certificate],
      prover: result.keys.pubKey,
      certificate: certificate,
      approved: true
    }); //AVI - THIS IS A HACK FOR NOW, JUST SEND ALL THE SIG TREE AND LET THE CLIENT FILTER IT
  });
}

function handleRejectCertificateVerification(msgData) {
  // Other peer doesnt want to prove himself to me. what do?
  console.log("Cretificate verification request rejected.");
  errorPopup("Your \"friend\" refused to identify");
}

function handleApproveCertificateVerification(msgData) {
  approveCertificateVerification = msgData.approveCertificateVerification;

  if (approveCertificateVerification.approved) {
    chrome.storage.sync.get(["keys", "sigTree"], function(result) {
      // Create signer
      SignatureController.importKeys(
        result["keys"].privKey,
        result["keys"].pubKey
      ).then(sigCont => {
        // Create tree object
        var signatureTree = SigTree(
          sigCont,
          approveCertificateVerification.signatureTree,
          approveCertificateVerification.certificate
        );
        // Verify
        signatureTree
          .verifiyCertificateTree(approveCertificateVerification.prover)
          .then(valid => {
            if (valid) {
              // Store if valid
              let trustEngine = TrustEngine(
                signatureTree.cleanedTree,
                [result.keys.pubKey],
                0.5,
                0.1
              );
              let score = trustEngine.calculateTrustScore(
                approveCertificateVerification.prover
              );
              showApprovedPopup(
                score,
                approveCertificateVerification.certificate
              ); //NATALY
            } else {
              errorPopup("Failed to verify chain of trust"); //NATALY
            }
          });
      });
    });
  }
}

// Get all the signatures that this user has in this certificates context
function getSignatureTree(_cert) {}

// sign on a requesters Signature
function signCert(_certificate, _requresterPK) {}

function parseSignatureTree(signatureTree) {
  return signatureTree; //placeholder
}

function storeSignatureTree() {}

function sendRequestCertificate() {}
function sendApproveCertificate() {}
function sendRejectCertificate() {}
function sendRequestCertificateVerification() {}
function sendRejectCertificateVerification() {}
function sendApproveCertificateVerification() {}
