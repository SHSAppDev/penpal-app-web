
'use strict';

// Initializes SchoolPage.
function SchoolPage() {
  this.schoolCodeInput = document.getElementById('school-code-input');
  this.searchButton = document.getElementById('search-button');
  this.searchButton.addEventListener('click', function(){
    this.initializeUserListWithSchoolCode(this.schoolCodeInput.value);
  }.bind(this));
  this.initFirebase();
  console.log("hi");
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
SchoolPage.prototype.initFirebase = function() {
  // Initialize Firebase.
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};



// Triggers when the auth state change for instance when the user signs-in or signs-out.
SchoolPage.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!

  }
};

SchoolPage.prototype.initializeUserListWithSchoolCode = function(schoolCode) {
  console.log("received code: "+schoolCode);
  console.log("in input"+this.schoolCodeInput.value);
};

// Stolen from stack overflow. Useful!
// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

window.onload = function() {
  new SchoolPage();
};
