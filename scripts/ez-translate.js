
// Requires jquery to work
// E-Z 💵!

// add this to the html file
// <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js"></script>
// And then of course add a link to this script

function EZTranslate() {
	// console.log("ez translate created!");
	this.translatorOccupied = false;
	this.objectiveNumberOfSentences = 0;
	this.numberOfSentencesTranslated = 0;
	// this.constructedTranslation = "";
	this.translatedSentences = [];
}

EZTranslate.prototype.translate = function(sourceLang, targetLang, sourceText, callback) {
	while(this.translatorOccupied) {
		continue;
	}
	this.translatorOccupied = true;
	var sentences = sourceText.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
	this.objectiveNumberOfSentences = sentences.length;
	for(var i=0; i<sentences.length;i++) {
		this.translateSingleSentence(sourceLang, targetLang, sentences[i], this.onSingleSentenceTranslated.bind(this, callback, i));
	}
};

EZTranslate.prototype.onSingleSentenceTranslated = function(ultimateCallback, index, translatedSentence) {

	this.numberOfSentencesTranslated += 1;
	this.translatedSentences[index] = translatedSentence+' ';
	if(this.numberOfSentencesTranslated == this.objectiveNumberOfSentences) {
		// var final = this.constructedTranslation;
		var final = '';
		for(var i=0; i<this.translatedSentences.length; i++) {
			final+=this.translatedSentences[i];
		}
		// this.constructedTranslation = "";
		this.translatedSentenced = [];
		this.objectiveNumberOfSentences = 0;
		this.numberOfSentencesTranslated = 0;
		ultimateCallback(final);
		this.translatorOccupied = false;
	}
};

//@param callback should be a function that takes the one parameter of the translated text
EZTranslate.prototype.translateSingleSentence = function(sourceLang, targetLang, sourceText, callback) {
	var api_url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="
            + sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(sourceText);
    $.ajax({
            type: "GET",
            url: api_url,
            success: function(data) {
                console.log(data);
            },
            error: function(resp, b){
                // LOOK AT THIS HACK!
                var respText = resp.responseText;
                respText = respText.replace(/,+/g,",");
                var respObj = JSON.parse(respText);
                respObj = respObj[0][0];
                var translatedText = respObj[0];
                callback(translatedText);
            }
        });
};
