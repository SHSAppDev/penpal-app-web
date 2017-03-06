
'use strict';

// Initializes AddConversation.
function AddConversation() {

  // Shortcuts to DOM Elements.
  this.addButton = document.getElementById('add-conversation-button');
  this.emailField = document.getElementById('email-field');

  this.addButton.addEventListener('click', this.addConversationToDatabase.bind(this));

  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
AddConversation.prototype.initFirebase = function() {
  // Initialize Firebase.
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));

};

AddConversation.prototype.addConversationToDatabase = function() {
  if(!this.auth.currentUser) { return; }
  var email = this.emailField.value;
  const ref = this.database.ref('user-data');
  ref.orderByChild('email')
    .equalTo(email)
    .once('value')
    .then(function (snapshot) {
      var value = snapshot.val();
      if (value) {
        // value is an object containing one or more of the users that matched your email query
        // choose a user and do something with it
        var uid = Object.keys(value)[0];
        this.addUidToMyConversations(uid);
      } else {
        window.alert("No user was found with that email.");
      }
    }.bind(this));

};

AddConversation.prototype.addUidToMyConversations = function(uid) {
  var myConversationsRef = this.database.ref('user-data/'+this.auth.currentUser.uid+"/conversations");
  myConversationsRef.push({
    recipientUID: uid
  }).then(function(){
    window.alert("Conversation Added Successfully!"+uid);
    this.emailField.value = "";
  }.bind(this)).catch(function(error) {
    window.alert("Uh Oh. Something went wrong. The conversation wasn't added. Sry.")
  });
};


// Triggers when the auth state change for instance when the user signs-in or signs-out.
AddConversation.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!

  } else { // User is signed out!

    //In this case, I just take the user straight back to the login.
    window.location.href = 'login.html';
  }
};

// A loading image URL.
AddConversation.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';


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

new AddConversation();
