var messageTypes = {
  REQUEST_CERTIFICATE: "REQUEST_CERTIFICATE",

  APPROVE_CERTIFICATE: "APPROVE_CERTIFICATE",

  REJECT_CERTIFICATE: "REJECT_CERTIFICATE",

  REQUEST_CERTIFICATE_VERIFICATION: "REQUEST_CERTIFICATE_VERIFICATION",

  REJECT_VERIFICIATION: "REJECT_VERIFICIATION",

  APPROVE_VERIFICATION: "APPROVE_VERIFICATION",

  ERROR: "ERROR"
};

class NessiSession {
	constructor(connection, localPeer, remotePeer){
		this.conn = connection;
		this.localPeer = localPeer;
		this.remotePeer = remotePeer;
		this.localPeer.on('connection', function(conn) {
        //console.log("established connection");
        	this.remotePeer = conn.peer;
	    });
	}

	receiveMessage: function(msg) {
		var message_obj = JSON.parse(msg);
		this.handleMessageReceive(message_obj);
	}

	sendNessiMessage: function(msg_obj) {
		sendMessage(this.conn, msg_obj);
	}

	parseMessage: function(data) {
	  return JSON.parse(data);
	}

	getMessageType: function(msg) {
	  return msg.messageType;
	}

	getMessageData: function(msg) {
	  return msg.messageData;
	}

	 handleMessageReceive: function(msg) {
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

	handleRequestCertificate: function(msgData) {
	  // other peer requested client to sign his cert
	  // show him the options and according to his answer send an approve/reject message
	  var certificate = msgData.certificate;
	  var certificateName = msgData.certificateName;
	  requestCertificatePopup(certificate, certificateName); //NATALY
	}

	/**
	 * Signs certificate for peer and sends it
	 * @param {str} certificate
	 */
	sendSignedCertificate: function(certificate) {
	  chrome.storage.sync.get(["keys", "sigTree"], function(result) {
	    console.log(result);
	    SignatureController.importKeys(
	      result["keys"].privKey,
	      result["keys"].pubKey
	    ).then(sigCont => {
	      hashData(certificate + result["keys"].pubKey).then(hashedData =>{
	        sigCont.sign(hashedData).then(signature =>
	        {	
	        	var _msg = ({
	        		messageType: messageTypes.APPROVE_CERTIFICATE,
	        		messagData:{
			            signerKey: result["keys"].pubKey,
			            signedCertificate: signature,
			            certificate: certificate,
			            signatureTree: result["sigTree"][certificate],
			            approved: true
	          		}
	          	})
	        	this.sendNessiMessage(_msg);
	        });
	      });
	    });
	  });
	}

	handleApproveCertificate: function(msgData) {
	  // someone approved my certificate
	  approveCertificate = msgData;
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

	handleRejectCertificate: function(msgData) {
	  // my REQUEST_CERTIFICATE got declined. what do?
	  // NATALY error popup?
	  errorPopup("Signature request declined");
	}

	handleRequestCertificateVerification: function(msgData) {
	  // other peer sent me a {cert}. that means I need to decide if I want to prove myself to him or not
	  // Display a (send certificate verification/ decline input box)
	  console.log("received request certificate verification");
	  var certificate = msgData.certificate;
	  var certificateName = msgData.certificateName;
	  requestVerificationPopup(certificate, certificateName); //NATALY
	}

	sendVerification: function(certificate) {
	  chrome.storage.sync.get(["keys", "sigTree"], function(result) {
	    sendMessage({
	    		messageType: messageTypes.APPROVE_VERIFICATION
				messagData: {
					signatureTree: result.sigTree[certificate],
			      	prover: result.keys.pubKey,
			      	certificate: certificate,
			      	approved: true    	
			     }
		      
	    	}); //AVI - THIS IS A HACK FOR NOW, JUST SEND ALL THE SIG TREE AND LET THE CLIENT FILTER IT
	  });
	}

	handleRejectCertificateVerification: function(msgData) {
	  // Other peer doesnt want to prove himself to me. what do?
	  console.log("Cretificate verification request rejected.");
	  errorPopup("Your \"friend\" refused to identify");
	}

	handleApproveCertificateVerification: function(msgData) {
	  approveCertificateVerification = msgData;

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
	getSignatureTree: function(_cert) {}

	// sign on a requesters Signature
	signCert: function(_certificate, _requresterPK) {}

	 parseSignatureTree: function(signatureTree) {
	  return signatureTree; //placeholder
	}

	// function storeSignatureTree() {}

	// function sendRequestCertificate() {}
	// function sendApproveCertificate() {}
	// function sendRejectCertificate() {}
	// function sendRequestCertificateVerification() {}
	// function sendRejectCertificateVerification() {}
	// function sendApproveCertificateVerification() {}

}