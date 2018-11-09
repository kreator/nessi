/*
  Be sure to load PeerJS + AJAX scripts before this script
*/

var userId = "";
var remotePeerId = "";

var peer = "";
var conn = "";

// function setUserId(e) {
//     e.preventDefault();
//     userId = $("#user").val();
//     peer = new Peer(userId, {host: 'localhost', port: 9000, path: '/'});

//     peer.on('connection', function(conn) {
//         //console.log("established connection");

//         conn.on('data', function(data){
//             // Will print 'hi!'
//             remotePeerId = conn.peer;
//             console.log(data);

//         });
//     });

//     $("#dcform").show();
//     return false;
// }

function createPeer(userId) {
    var peer = new Peer(userId, {host: 'localhost', port: 9000, path: '/'});
    peer.on('connection', function(conn) {
        //console.log("established connection");
        
        conn.on('data', function(data){
            console.log(data);

        });
    });
    return peer;
}

function createConnection(localPeer, remotePeerId) {
    var conn = localPeer.connect(remotePeerId);
    // conn.on('open', function(){
    //     // here you have conn.id
    //     //conn.send('hi!');
    //     $("#sendform").show();
    // }); 
    return conn;
}

function setRemotePeerId(e) {
    e.preventDefault();
    remotePeerId = $("#connectTo").val();
    $("#connect").show();
}

function connect(e) {
    e.preventDefault();
    //debugger;
    if (userId != "") {
        if ( remotePeerId != ""){
            debugger;
            conn = peer.connect(remotePeerId);
            console.log("created connection object");
            // on open will be launch when you successfully connect to PeerServer
            conn.on('open', function(){
                // here you have conn.id
                //conn.send('hi!');
                $("#sendform").show();
             });    
        }
               
    }
}

function sendMessage(connection, message_obj) {
    connection.send(JSON.stringify(message_obj));
}

