
'use strict';

var message = document.getElementById('message');

// Initialize all the special character things

const BTN_TEMPLATE = '<a class="waves-effect waves-teal btn-flat special-character-tool-button">'+
  '<span class="notranslate" style="text-transform:none;">INSERT-CHAR</span></a>';
const charSets = {
  'es': ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'],
  'fr': ['é', 'à', 'è', 'ù', 'â', 'ê', 'î', 'ô', 'û', 'ç', 'ë', 'ï','ü'],
  'de': ['ä', 'Ä', 'é', 'ö', 'Ö', 'ü', 'Ü', 'ß'],
  'emoji': ['😀','😎','😯','😕','👍','👊','❤️','😆','😅']
};

function setCharsetInUI(charsetIdentifier){
  var chars = charSets[charsetIdentifier];
  var insertHTML = '';
  for(var i=0; i < chars.length; i++) {
    const char = chars[i];
    var btnHTML = BTN_TEMPLATE.replace('INSERT-CHAR', char);
    insertHTML += btnHTML;
  }
  $('#special-characters-panel .collapsible-body').html(insertHTML);
  $('.special-character-tool-button').click(function(){
    var character = this.textContent;
    message.focus();
    message.value += character;
  });
}




setCharsetInUI('es');
