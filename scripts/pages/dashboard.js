'use strict';

// Initializes W3Dashboard.
function W3Dashboard() {

    // Shortcuts to DOM Elements.
    this.userPic = document.getElementById('user-pic');
    // this.userName = document.getElementById('user-name');
    this.initFirebase();
}


W3Dashboard.URL_PROFILE_PLACEHOLDER = '/images/profile_placeholder.png';
W3Dashboard.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';


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
    }
};

// Stolen from stack overflow. Useful!
// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);s
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

window.onload = function() {
    window.dashboardScript = new W3Dashboard();
    // document.getElementById('button-collapse').sideNav(); //DISABLED because js says sideNav() isn't a function.
};

(function($) {
    $(function() {
        $('.button-collapse').sideNav();
    }); // end of document ready
})(jQuery); // end of jQuery name space
