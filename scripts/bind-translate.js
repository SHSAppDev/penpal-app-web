
'use strict';

function BindTranslate() {
  this.sourceLang = document.getElementById('sourceLangSelect');
  this.targetLang = document.getElementById('targetLangSelect');
  this.sourceText = document.getElementById('translateSourceText');
  this.translateButton = document.getElementById('translateSourceTextButton');
  this.output = document.getElementById('translatedText');
  this.translateButton.addEventListener('click', this.translate.bind(this));
  this.translator = new EZTranslate();
}

BindTranslate.prototype.translate = function() {
  var source = this.sourceText.value;
  var srcLang = this.sourceLang.options[this.sourceLang.selectedIndex].value;
  if(srcLang==="") {
    window.alert("Choose a source language before translating.");
    return;
  }
  var targetLang = this.targetLang.options[this.targetLang.selectedIndex].value;
  if(targetLang==="") {
    window.alert("Choose a target language before translating");
    return;
  }
  this.translator.translate(srcLang, targetLang, source, this.onTextTranslated.bind(this));
};

BindTranslate.prototype.onTextTranslated = function(translatedText) {
  this.output.textContent = translatedText;
};

// var buttonID = document.currentScript.getAttribute('buttonID');
new BindTranslate();
