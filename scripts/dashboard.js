
'use strict';

// Initializes W3Dashboard.
function W3Dashboard() {

  // Shortcuts to DOM Elements.
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.conversationList = document.getElementById('conversation-list');

  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
W3Dashboard.prototype.initFirebase = function() {
  // Initialize Firebase.
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // this.userDataRef = this.database.ref('user-data');

  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));


};


// Signs-in
W3Dashboard.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out
W3Dashboard.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

W3Dashboard.URL_PROFILE_PLACEHOLDER = '/images/profile_placeholder.png';

// Checks if the given userID is registered in user-data, and if it's not,
// the userID gets registered
W3Dashboard.prototype.checkForFirstTimeUser = function(userId) {
  var userRef = this.database.ref('user-data/'+userId);
  userRef.once('value', function(snapshot) {
    if(snapshot.val() === null) {
      // We have ourselves a first time user!
      // console.log("this="+this);
      userRef.set({
        displayName: this.auth.currentUser.displayName,
        photoURL: this.auth.currentUser.photoURL || W3Dashboard.URL_PROFILE_PLACEHOLDER
      });
    }
  }.bind(this));
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
W3Dashboard.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    //First, check for first time user.
    this.checkForFirstTimeUser(this.auth.currentUser.uid);
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

    this.loadConversations();

  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    // this.userName.setAttribute('hidden', 'true');
    // this.userPic.setAttribute('hidden', 'true');
    // this.signOutButton.setAttribute('hidden', 'true');

    // // Show sign-in button.
    // this.signInButton.removeAttribute('hidden');

    //In this case, I just take the user straight back to the login.
    window.location.href = 'login.html';
  }
};

W3Dashboard.prototype.loadConversations = function() {
  this.myConversationsRef = this.database.ref('user-data/'+this.auth.currentUser.uid+'/conversations');
  this.myConversationsRef.off();
  var setConversation = function(data) {
    // Each item is a random key with a recipientUserID
    // console.log(this.displayConversation);
    this.displayConversation(data.val().recipientUID);
  }
  this.myConversationsRef.on('child_added', setConversation.bind(this));
  this.myConversationsRef.on('child_changed', setConversation.bind(this));

};

W3Dashboard.prototype.displayConversation = function(recipientUID) {

  // this.userDataRef.child(recipientUID).once('value', function(snapshot){
  this.database.ref('user-data/'+recipientUID).once('value').then(function(snapshot){

    var div = document.getElementById(recipientUID);
    if(!div) {
      var container = document.createElement('div');
      container.innerHTML = W3Dashboard.CONVERSATION_TEMPLATE;
      div = container.firstChild;
      div.setAttribute('id', recipientUID);
      // console.log(this.conversationList.appendChild); //HELP
      this.conversationList.appendChild(div);
    }
    var urlForPic = null;
    if(snapshot.val().photoURL !== null) {
      urlForPic = snapshot.val().photoURL;
    } else {
      urlForPic = W3Dashboard.URL_PROFILE_PLACEHOLDER;
    }
    // div.querySelector('.pic').style.backgroundImage = 'url(' + urlForPic.replace('"', '') + ')';
    div.querySelector('.pic').src = urlForPic;
    div.querySelector('#conversation-link').href = 'conversation.html?targetUID='+recipientUID;
    // console.log(div.querySelector('.pic').style.backgroundImage);

    div.querySelector('.name').textContent = snapshot.val().displayName;
  }.bind(this));
};

W3Dashboard.CONVERSATION_TEMPLATE =
    '<div>' +
      // '<div class="spacing"><div class="pic"></div></div>' +
      '<a href=# id="conversation-link">'+
        '<img src=# class="pic">' +
        '<div class="name"></div>' +
      '</a>'
    '</div>';

// W3Chat.prototype.displayMessage = function(key, name, text, picUrl, imageUri) {
//   var div = document.getElementById(key);
//   // If an element for that message does not exists yet we create it.
//   if (!div) {
//     var container = document.createElement('div');
//     container.innerHTML = W3Chat.MESSAGE_TEMPLATE;
//     div = container.firstChild;
//     div.setAttribute('id', key);
//     this.messageList.appendChild(div);
//   }
//   if (picUrl) {
//     div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
//   }
//   div.querySelector('.name').textContent = name;
//   var messageElement = div.querySelector('.message');
//   if (text) { // If the message is text.
//     messageElement.textContent = text;
//     // Replace all line breaks by <br>.
//     messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
//   } else if (imageUri) { // If the message is an image.
//     var image = document.createElement('img');
//     image.addEventListener('load', function() {
//       this.messageList.scrollTop = this.messageList.scrollHeight;
//     }.bind(this));
//     this.setImageUrl(imageUri, image);
//     messageElement.innerHTML = '';
//     messageElement.appendChild(image);
//   }
//   // Show the card fading-in.
//   setTimeout(function() {div.classList.add('visible')}, 1);
//   this.messageList.scrollTop = this.messageList.scrollHeight;
//   this.messageInput.focus();
// };
// Loads chat messages history and listens for upcoming ones.
// W3Chat.prototype.loadMessages = function() {
//   // Load and listens for new messages.
//   // The conversation reference is /conversations/{both UIDs stuck together}
//   // The order that they're stuck together is based on which one is greater in ASCII land.
//   var uid1 = this.auth.currentUser.uid;
//   var uid2 = getParameterByName('targetUID');
//   var uids = uid1 > uid2 ? uid1+uid2 : uid2+uid1;
//   this.messagesRef = this.database.ref('conversations/'+uids);
//   this.messagesRef.off();


//   // Loads the last 12 messages and listen for new ones.
//   var setMessage = function(data) {
//     var val = data.val();
//     this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl);
//   }.bind(this);
//   this.messagesRef.limitToLast(12).on('child_added', setMessage);
//   this.messagesRef.limitToLast(12).on('child_changed', setMessage);
// };

// Template for messages.


// A loading image URL.
// W3Dashboard.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';


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
  window.dashboardScript = new W3Dashboard();
};
