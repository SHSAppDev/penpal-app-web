// loads and saves the user's timezone


function UserInfo() {
	this.getTimeZone();
	this.loadTime();
}

UserInfo.prototype.getTimeZone = function() {
	if (!sessionStorage.getItem('timezone')) {
		var tz = jstz.determine() || 'UTC';
		sessionStorage.setItem('timezone', tz.name());
	}
	this.currTz = sessionStorage.getItem('timezone');
};

UserInfo.prototype.loadTime = function() {
	var now = new Date;
	var hours;
	var minutes;
	if (now.getUTCHours() <= 9) {
		hours = "0" + now.getUTCHours();
	} else {
		hours = now.getUTCHours();
	}

	if (now.getUTCMinutes() <= 9) {
		minutes = "0" + now.getUTCMinutes();
	} else {
		minutes = now.getUTCMinutes();
	}

	// console.log("Hours: " + hours);
	// console.log("Minutes: " + minutes);

	var time = hours + ":" + minutes;
	// console.log(time);
	this.convertTime(time);
}

UserInfo.prototype.convertTime = function(theTime) {
	// console.log("Converting time");
	var date = moment().format("YYYY-MM-DD");
	var stamp = date + "T" + theTime + "Z";
	var momentTime = moment(stamp);

	// console.log("currTz: " + currTz);
	var tzTime = momentTime.tz(this.currTz);
	var formattedTime = tzTime.format('h:mm A');

	// console.log("formatted time: " + formattedTime);
	window.formattedTime = formattedTime;
	this.formattedTime = formattedTime;
	// localTime.textContent = "Time in " + currTz + ": " + formattedTime;
	// saveToFirebase(currTz);
};

UserInfo.prototype.saveToFirebase = function(timezone) {
	// console.log("saving to firebase")
	if(firebase.auth().currentUser === null) {
		console.log("Unable to save to firebase due to the user not yet being " +
		"authenticated. Avoid calling startTrackingTime before the user has been authenticated.");
		return;
	}
	// Make a firebase reference to the currentUser
	var myUID = firebase.auth().currentUser.uid;
	var userRef = firebase.database().ref('user-data/' + myUID);
	//Push updates
	var updates = {};
	updates['/timezone'] = timezone; // b

	userRef.update(updates);
};

UserInfo.prototype.startTrackingTime = function() {
	setInterval(function(){
		this.getTimeZone();
		this.loadTime();
		this.saveToFirebase(this.currTz);
	}.bind(this), 60*1000);
};
// console.log("got user info");
// loadTime();
