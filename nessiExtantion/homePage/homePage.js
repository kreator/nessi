let submit = document.getElementById('submit');

submit.onclick = function(element) {
  var name= document.getElementById("input_name").value
  var image_url = "nataly_img.jpeg";
  chrome.storage.sync.set({user_name: name, image_url:image_url}, function() {
    console.log('The name is:' + name);
    window.close();
  });


};
