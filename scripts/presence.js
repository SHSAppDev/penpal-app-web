
'use strict';

// Do not create object unless user is already authenticated.

function Presence() {
	var amOnline = firebase.database().ref('.info/connected');
	const userid = firebase.auth().currentUser.uid;
	var userPresRef = firebase.database().ref('presence/' + userid);
	this.userPresRef = userPresRef;
	amOnline.on('value', function(snapshot) {
	  if (snapshot.val() && !this.manualLock) {
	    userPresRef.onDisconnect().remove();
			// console.log('pres stuff set');
	    userPresRef.set(true);
	  }
	}.bind(this));
}

// Just in case one needs to manually set their state.
Presence.prototype.setState = function(state) {
	this.manualLock = true;
	this.userPresRef.set(state);
};

Presence.prototype.removeManualLock = function() {
	this.manualLock = false;
}
