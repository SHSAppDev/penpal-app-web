
'use strict';

var message = document.getElementById('message');
var allCharacterButtons = document.getElementsByClassName("special-character-tool-button");
for(var i=0; i<allCharacterButtons.length; i++) {
  var btn = allCharacterButtons[i];
  btn.addEventListener('click', function(){
    message.focus();
    var char = this.textContent;
    message.value += char;
  });
}
