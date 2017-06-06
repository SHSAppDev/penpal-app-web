
'use strict';

// Do not create object unless user is already authenticated.

function Presence() {
	var amOnline = firebase.database().ref('.info/connected');
	const userid = firebase.auth().currentUser.uid;
	var userPresRef = firebase.database().ref('presence/' + userid);
	amOnline.on('value', function(snapshot) {
	  if (snapshot.val()) {
	    userPresRef.onDisconnect().remove();
	    userPresRef.set(true);
	  }
	});
}
