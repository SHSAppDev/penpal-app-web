'use strict';

// Initializes W3Dashboard.
function W3Dashboard() {

    // Shortcuts to DOM Elements.
    this.userPic = document.getElementById('user-pic');
    // this.userName = document.getElementById('user-name');
    this.signOutButton = document.getElementById('sign-out');
    this.signOutButtonMobile = document.getElementById('sign-out-mobile');
    this.conversationList = document.getElementById('conversation-list');


    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.signOutButtonMobile.addEventListener('click', this.signOut.bind(this));

    this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
W3Dashboard.prototype.initFirebase = function() {
    // Initialize Firebase.
    // Shortcuts to Firebase SDK features.
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    // Initiates Firebase auth and listen to auth state changes.
    this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));


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
        var profilePicUrl = user.photoURL; // Get profile pic.
        // var userName = user.displayName;        // Get user's name.

        // Set the user's profile pic and name.
        this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
        // this.userName.textContent = userName;

        // Show user's profile and sign-out button.
        // this.userName.removeAttribute('hidden');
        this.userPic.removeAttribute('hidden');
        this.signOutButton.removeAttribute('hidden');

        this.loadConversations();


    } else { // User is signed out!

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
    if(snapshot.val()===null) {return;}

    var div = document.getElementById(recipientUID);
    if(!div) {
      var container = document.createElement('div');
      container.innerHTML = W3Dashboard.CONVERSATION_TEMPLATE;
      div = container.firstChild;
      div.setAttribute('id', recipientUID);
      // console.log(this.conversationList); //HELP
      this.conversationList.appendChild(div);
    }
    // Set recipient profile pic in conversation button
    // var urlForPic = null;
    // if(snapshot.val().photoURL !== null) {
    //   urlForPic = snapshot.val().photoURL;
    // } else {
    //   urlForPic = W3Dashboard.URL_PROFILE_PLACEHOLDER;
    // }
    // // div.querySelector('.pic').style.backgroundImage = 'url(' + urlForPic.replace('"', '') + ')';
    // div.querySelector('.pic').src = urlForPic;
    // div.querySelector('#conversation-link').href = 'conversation.html?targetUID='+recipientUID;
    div.href = 'conversation.html?targetUID='+recipientUID;
    div.textContent = snapshot.val().displayName;
    console.log(div.querySelector('#bleh'));
    // div.querySelector('#bleh').textContent = 1; //Hardcoded value

    // console.log(div.querySelector('.pic').style.backgroundImage);

    // div.querySelector('.name').textContent = snapshot.val().displayName;
  }.bind(this));
};


// Template for messages.
// W3Dashboard.MESSAGE_TEMPLATE =
//     '<div class="message-container">' +
//     '<div class="spacing"><div class="pic"></div></div>' +
//     '<div class="message"></div>' +
//     '<div class="name"></div>' +
//     '</div>';

W3Dashboard.CONVERSATION_TEMPLATE =
    '<a href=# class="collection-item">' +
      '<span class="new badge" id="bleh"></span>Name'+
    '</a>';

    // '<div>' +
    //   // '<div class="spacing"><div class="pic"></div></div>' +
    //   '<a href=# id="conversation-link">'+
    //     '<img src=# class="pic">' +
    //     '<div class="name"></div>' +
    //   '</a>'
    // '</div>';



// A loading image URL.
W3Dashboard.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';


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
    // document.getElementById('.button-collapse').sideNav();
};

(function($) {
    $(function() {
        $('.button-collapse').sideNav();
    }); // end of document ready
})(jQuery); // end of jQuery name space
