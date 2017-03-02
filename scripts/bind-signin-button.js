
'use strict';

// Reference this script when you want to make a sign-in button actually sign-in.
// REQUIRES an html element with an ID of 'sign-in'

function BindSignIn() {
  this.signInButton = document.getElementById('sign-in');
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
    window.location.href = 'index.html';
  }
};

new BindSignIn();
