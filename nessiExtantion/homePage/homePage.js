chrome.storage.sync.get(["user_name"], function(result) {
  if (result.user_name !== 'undefined')
  {
    document.getElementById("specText").innerHTML = "<img src='../images/loch-ness-monster-Big.png'><span>" + result.user_name + "</span>";
  }
  else {
    let submit = document.getElementById('submit');

    submit.onclick = function(element) {
      var name= document.getElementById("input_name").value
      var image_url = "nataly_img.jpeg";

      console.log('The name ');
      SignatureController.generateKeys().then((keys)=> {
        chrome.storage.sync.set({user_name: name, image_url:image_url, keys:{privKey:keys[0], pubKey:keys[1]}, sigTree:{}}, function() {
          console.log('The name is:' + name);
          window.close();
        });
      });
    };
  }
});
