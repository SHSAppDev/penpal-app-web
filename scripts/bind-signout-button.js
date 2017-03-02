
'use strict';

// REQUIRES
// button with id 'sign-out'

function BindSignOut() {
  this.signInButton = document.getElementById('sign-out');
  this.signInButton.addEventListener('click', this.signOut.bind(this));
  firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
}

BindSignOut.prototype.signOut = function() {
  firebase.auth().signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
BindSignOut.prototype.onAuthStateChanged = function(user) {
  if (!user) { // User is signed out!
    window.location.href = 'login.html';
  }
};

new BindSignOut();
