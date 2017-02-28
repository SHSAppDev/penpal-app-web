
'use strict';

// Initializes AddConversation.
function AddConversation() {

  // Shortcuts to DOM Elements.
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.addButton = document.getElementById('add-conversation-button');
  this.uidField = document.getElementById('uid-field');
 
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  // this.signInButton.addEventListener('click', this.signIn.bind(this));
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
  var enteredInID = this.uidField.value;
  var myConversationsRef = this.database.ref('user-data/'+this.auth.currentUser.uid+"/conversations");
  myConversationsRef.push({
    recipientUID: enteredInID
  }).then(function(){
    window.alert("Conversation Added Successfully!");
    this.uidField.value = "";
  }.bind(this)).catch(function(error) {
    window.alert("Uh Oh. Something went wrong. The conversation wasn't added. Sry.")
  });
};

// W3Chat.prototype.saveMessage = function(e) {
//   e.preventDefault();
//   // Check that the user entered a message and is signed in.
//   if (this.messageInput.value && this.checkSignedInWithMessage()) {

//     // Push new message to Firebase.
//     var currentUser = this.auth.currentUser;
//     // Add a new message entry to the Firebase Database.
//     this.messagesRef.push({
//       name: currentUser.displayName,
//       text: this.messageInput.value,
//       photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
//     }).then(function() {
//       // Clear message text field and SEND button state.
//       W3Chat.resetMaterialTextfield(this.messageInput);
//       this.toggleButton();
//     }.bind(this)).catch(function(error) {
//       console.error('Error writing new message to Firebase Database', error);
//     });

//   }
// };


// // Signs-in 
// AddConversation.prototype.signIn = function() {
//   // Sign in Firebase using popup auth and Google as the identity provider.
//   var provider = new firebase.auth.GoogleAuthProvider();
//   this.auth.signInWithPopup(provider);
// };

// Signs-out
AddConversation.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
AddConversation.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;   // Get profile pic.
    var userName = user.displayName;        // Get user's name.

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

  } else { // User is signed out!

    //In this case, I just take the user straight back to the login.
    window.location.href = 'login.html';
  }
};

// Template for messages.
// AddConversation.MESSAGE_TEMPLATE =
//     '<div class="message-container">' +
//       '<div class="spacing"><div class="pic"></div></div>' +
//       '<div class="message"></div>' +
//       '<div class="name"></div>' +
//     '</div>';

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

window.onload = function() {
  window.dashboardScript = new AddConversation();
};
