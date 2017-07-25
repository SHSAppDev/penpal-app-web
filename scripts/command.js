

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
	const reqPromise = this.reqRef.push({
		"action": action,
		"params": params,
		"uid": firebase.auth().currentUser.uid
	});
	// console.log(reqPromise.key);
	reqPromise.then(function(){
		// Watch the response child for something and call success if something appears there.
		this.reqRef.child(reqPromise.key+'/response').on('value', function(data){
			if(data.val()) {
				this.reqRef.child(reqPromise.key).remove();
				this.reqRef.child(reqPromise.key+'/response').off();
				return callback.success(data.val());
			}
		}.bind(this));
		// Also watch error and see if something appears there.
		this.reqRef.child(reqPromise.key+'/error').on('value', function(data){
			if(data.val()) {
				this.reqRef.child(reqPromise.key).remove();
				this.reqRef.child(reqPromise.key+'/error').off();
				return callback.error(data.val());
			}
		}.bind(this));

	}.bind(this));
	reqPromise.catch(function(err){
		callback.error(err);
	}.bind(this));
};

