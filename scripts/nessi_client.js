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
    SignatureController.importKeys(result["keys"].privKey, result["keys"].pubKey).then(
      sigCont => {
        hashData(certificate + result["keys"].pubKey).then(hashedData =>
          sigCont.sign(hashedData).then(signature =>
            sendMessage(APPROVE_CERTIFICATE, {
              //AVI
              signerKey: result["keys"].pubKey,
			  signedCertificate: signature,
			  certificate: certificate,
              signatureTree: result[0][certificate],
              approved: true
            })
          )
        );
      }
    );
  });
}

function handleApproveCertificate(msgData) {
  // someone approved my certificate
  approveCertificate = msgData.approveCertificate;
  if (approveCertificate.approved) {
    // Fetch keys from storage
    chrome.storage.sync.get(["keys", "sigTree"], function(result) {
      SignatureController.importKeys(result["keys"].privKey, result["keys"].pubKey).then(
        sigCont => {
			var signatureTree = SigTree(sigCont, approveCertificate.signatureTree, approveCertificate.certificate);
			signatureTree.validateReceivedCertificate(approveCertificate.signerKey, approveCertificate.signedCertificate).then(valid =>{
				if(valid){
					let oldTree = result["sigTree"];
					oldTree[approveCertificate.certificate] = deepmerge(oldTree[approveCertificate.certificate], approveCertificate.signatureTree);
				}
				else{
					errorPopup("Verifying faild") //NATALY
 				}
			})
		}
      );
    });
  }
}

function handleRejectCertificate(msgData) {
  // my REQUEST_CERTIFICATE got declined. what do?
}

function handleRequestCertificateVerification(msgData) {
  // other peer sent me a {cert}. that means I need to decide if I want to prove myself to him or not
  // Display a (send certificate verification/ decline input box)
  console.log("received request certificate verification");
}

function handleRejectCertificateVerification(msgData) {
  // Other peer doesnt want to prove himself to me. what do?
  console.log("Cretificate verification request rejected.");
}

function handleApproveCertificateVerification(msgData) {
  approveCertificateVerification = msgData.approveCertificateVerification;

  if (approveCertificateVerification.approved) {
    var sigTree = approveCertificateVerification.signatureTree;
    var calculatedTrust = calculateTrust(sigTree);
    return calculateTrust;
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
