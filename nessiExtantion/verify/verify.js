
let user_name;

chrome.storage.sync.get(['user_name', 'image_url'], function(result){
    user_name = result.user_name;
    image_url = result.image_url;

    document.getElementById("specText").innerHTML +=
     "<span>" + window.sender_persone_name + " wants to verify that you are " + window.certificate_type + "</span>";

  //  document.getElementById("specImg").innerHTML +=
    //  "<img src='../images/" + image_url + "' style='width:50%' ><span class='smallText'>"+ user_name +"</span>";


});


let verify = document.getElementById('verify');

verify.onclick = function(element) {
 sendSignedCertificate(window.certificate_type);
 console.log("nnnnnnnn");
  window.close();
};

let decline = document.getElementById('decline');

decline.onclick = function(element) {
  window.close();
};
