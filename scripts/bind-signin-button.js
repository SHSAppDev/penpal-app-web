
'use strict';

function BindSignIn(buttonID) {
  this.signInButton = document.getElementById(buttonID);
  this.checkSetup();
  this.signInButton.addEventListener('click', this.signIn.bind(this));
  firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
}

BindSignIn.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
BindSignIn.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    window.location.href = 'dashboard.html';
  }
};

BindSignIn.prototype.checkSetup = function() {
  if(this.signInButton == null) {
    window.alert("bind-signin-button.js: Provide an attribute called buttonID in the script tag.");
  }
};

var buttonID = document.currentScript.getAttribute('buttonID');
new BindSignIn(buttonID);
