

// Object to be used as a shortcut for requesting firebase
// cloud functions to be run. Only create and use this object after the user
// has been authenticated.


function Command() {
	this.reqRef = firebase.database().ref('function-requests');
}


// Call to request a function.
// Callback should be an object that contains two functions,
// one for success and one for error.
Command.prototype.requestFunction = function(action, params, callback) {
	this.reqRef.push({
		"action": action,
		"params": params,
		"uid": firebase.auth().currentUser.uid
	}).then(callback.success)
	// .catch(callback.error);
};
