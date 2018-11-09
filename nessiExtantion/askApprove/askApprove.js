document.getElementById("specText").innerHTML += "<span>" + window.persone_name +" has ask you to provide him a " + window.certificate_type + " certificate</span>";

document.getElementById("specImg").innerHTML += "<img src='../images/" + window.image + "' style='width:30%; border-radius: 50%' >";


let approve = document.getElementById('approve');

approve.onclick = function(element) {
  nessiSession.sendSignedCertificate(window.certificate_type);  
  window.close();
};

let denay = document.getElementById('denay');

denay.onclick = function(element) {
  window.close();
};
