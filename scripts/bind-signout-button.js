
'use strict';

// REQUIRES
// button with id 'sign-out'

function BindSignOut(buttonID) {
  this.checkSetup();
  this.signOutButton = document.getElementById(buttonID);
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
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

BindSignOut.prototype.checkSetup = function() {
  if(!this.signOutButton) {
    window.alert("bind-signout-button.js: Provide an attribute called buttonID in the script tag.");
  }
};

var buttonID = document.currentScript.getAttribute('buttonID');
new BindSignOut(buttonID);
