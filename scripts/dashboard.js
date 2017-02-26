'use strict';

// Initializes W3Dashboard.
function W3Dashboard() {

    // Shortcuts to DOM Elements.
    this.userPic = document.getElementById('user-pic');
    // this.userName = document.getElementById('user-name');
    this.signOutButton = document.getElementById('sign-out');
    this.signOutButtonMobile = document.getElementById('sign-out-mobile');


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

// Triggers when the auth state change for instance when the user signs-in or signs-out.
W3Dashboard.prototype.onAuthStateChanged = function(user) {
    if (user) { // User is signed in!
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


    } else { // User is signed out!

        //In this case, I just take the user straight back to the login.
        window.location.href = 'login.html';
    }
};

// Template for messages.
W3Dashboard.MESSAGE_TEMPLATE =
    '<div class="message-container">' +
    '<div class="spacing"><div class="pic"></div></div>' +
    '<div class="message"></div>' +
    '<div class="name"></div>' +
    '</div>';

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
    document.getElementById('.button-collapse').sideNav();
};

(function($) {
    $(function() {
        $('.button-collapse').sideNav();
    }); // end of document ready
})(jQuery); // end of jQuery name space
