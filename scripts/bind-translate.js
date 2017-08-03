
'use strict';

function BindTranslate() {
  this.sourceLang = document.getElementById('sourceLangSelect');
  this.targetLang = document.getElementById('targetLangSelect');
  this.sourceText = document.getElementById('translateSourceText');
  this.translateButton = document.getElementById('translateSourceTextButton');
  this.output = document.getElementById('translatedText');
  this.translateButton.addEventListener('click', this.translate.bind(this));
  this.chatContainer = document.getElementById('chat');
  // document.onmouseup = this.translateSelection.bind(this);
  this.translator = new EZTranslate();
}

BindTranslate.prototype.translate = function() {
  var source = this.sourceText.value;
  var srcLang = this.sourceLang.options[this.sourceLang.selectedIndex].value;
  if(srcLang==="") {
    Materialize.toast("Choose a source language before translating.", 4000);
    return;
  }
  var targetLang = this.targetLang.options[this.targetLang.selectedIndex].value;
  if(targetLang==="") {
    Materialize.toast("Choose a target language before translating", 4000);
    return;
  }
  this.translator.translate(srcLang, targetLang, source, this.onTextTranslated.bind(this));
};

BindTranslate.prototype.onTextTranslated = function(translatedText) {
  this.output.textContent = translatedText;
};

//Tests if child html element is descendant of parent html element
function isDescendant(parent, child) {
     if(child.parentNode === null) return false;
     var node = child.parentNode;
     while (node != null) {
         if (node == parent) {
             return true;
         }
         node = node.parentNode;
     }
     return false;
}

BindTranslate.prototype.translateSelection = function() {
  // var temp = document.createElement('div');
  // temp.innerHTML = this.getHtmlOfSelection();
  // var selectedElement = temp.firstChild;
  // if(selectedElement !== null && isDescendant(this.chatContainer, selectedElement)) {
  //   console.log(selectedElement);
  // }
  var selectedText = this.getSelectedText();
  if(selectedText !== null && selectedText.trim() !== '' ) {
    console.log("translating "+selectedText);
    this.sourceText.textContent = selectedText;
    this.translate(selectedText);
  }
}

BindTranslate.prototype.getSelectedText = function() {
    var text = "";
    if (typeof window.getSelection != "undefined") {
        text = window.getSelection().toString();
    } else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
        text = document.selection.createRange().text;
    }
    return text;
};

// BindTranslate.prototype.getHtmlOfSelection = function getHTMLOfSelection () {
//       var range;
//       if (document.selection && document.selection.createRange) {
//         range = document.selection.createRange();
//         return range.htmlText;
//       }
//       else if (window.getSelection) {
//         var selection = window.getSelection();
//         if (selection.rangeCount > 0) {
//           range = selection.getRangeAt(0);
//           var clonedSelection = range.cloneContents();
//           var div = document.createElement('div');
//           div.appendChild(clonedSelection);
//           return div.innerHTML;
//         }
//         else {
//           return '';
//         }
//       }
//       else {
//         return '';
//       }
//     };



// var buttonID = document.currentScript.getAttribute('buttonID');
new BindTranslate();
