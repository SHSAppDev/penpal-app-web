
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
	this.constructedTranslation = "";
}

EZTranslate.prototype.translate = function(sourceLang, targetLang, sourceText, callback) {
	while(this.translatorOccupied) {
		continue;
	}
	this.translatorOccupied = true;
	var sentences = sourceText.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
	this.objectiveNumberOfSentences = sentences.length;
	for(var i=0; i<sentences.length;i++) {
		this.translateSingleSentence(sourceLang, targetLang, sentences[i], this.onSingleSentenceTranslated.bind(this, callback));
	}
};

EZTranslate.prototype.onSingleSentenceTranslated = function(ultimateCallback, translatedSentence) {
	this.numberOfSentencesTranslated += 1;
	this.constructedTranslation += translatedSentence+' ';
	if(this.numberOfSentencesTranslated == this.objectiveNumberOfSentences) {
		var final = this.constructedTranslation;
		this.constructedTranslation = "";
		this.translatorOccupied = false;
		this.objectiveNumberOfSentences = 0;
		this.numberOfSentencesTranslated = 0;
		ultimateCallback(final);
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
                // alert();
            },
            error: function(resp, b){
                // LOOK AT THIS HACK!
                var respText = resp.responseText;
                respText = respText.replace(/,+/g,",");
                //var respObj = JSON.parse(resp.responseText);

                var respObj = JSON.parse(respText);
                respObj = respObj[0][0];
                // console.log(respObj[0]);

                var translatedText = respObj[0];
                // appendText(translatedText);
                // console.log(respObj);
                // console.log(sourceLang);
                // console.log(targetLang);
                // if (translatedText == prevSourceText){
                //     appendText("Found equilibrium");
                // }
                // else if (depth < maxdepth){
                //     translateRecurse(targetLang, sourceLang, sourceText, translatedText, depth+1, maxdepth);
                // }
                callback(translatedText);
            }
        });
};
