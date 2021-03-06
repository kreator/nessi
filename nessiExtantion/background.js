window.peer = {};
window.nessiSession = {};
chrome.storage.sync.get(["keys"], function(result) {
  window.peer = createPeer("NatalyShv");
  window.peer.on("connection", function(conn) {
    //console.log("established connection");
    window.nessiSession = new NessiSession(conn, window.peer, conn.peer);
    conn.on("data", function(data) {
      window.nessiSession.receiveMessage(data);
    });
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.message_type == "NESSI-INIT")
    {
      var win = window.open("approve/approveIdentity.html", "extension_popup", "width=180,height=220,status=no,scrollbars=yes,resizable=no");
      win.certificate_type = request.certificate_type;
      var conn = createConnection(peer, request.certificate_type);
      nessiSession = new NessiSession(conn, peer, request.certificate_type);

      sendResponse({farewell: "goodbye"});
    }
    if (request.message_type == "NESSI-REQUEST")
    {
      var win = window.open("askApprove/askApprove.html", "extension_popup", "width=220,height=270,status=no,scrollbars=yes,resizable=no");
      win.persone_name = request.persone_name;
      win.certificate_type = request.certificate_type;
      win.image = request.image;
      sendResponse({farewell: "goodbye"});
    }
    if (request.message_type == "NESSI-VERIFY")
    {
      var win = window.open("verify/verify.html", "extension_popup", "width=200,height=335,status=no,scrollbars=yes,resizable=no");
      win.sender_persone_name = request.sender_persone_name;
      win.certificate_type = request.certificate_type;
      sendResponse({farewell: "goodbye"});
    }
    if (request.message_type == "ERROR")
    {
      var win = window.open("errorPopup/errorPopup.html", "extension_popup", "width=180,height=230,status=no,scrollbars=yes,resizable=no");
      win.error_message = request.error_message;
      sendResponse({farewell: "goodbye"});
    }
  });
