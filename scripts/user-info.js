// loads and saves the user's information that is usually
// related to timezones and stuff.
// Requires dependencies:
// <script src='https://cdnjs.cloudflare.com/ajax/libs/jstimezonedetect/1.0.4/jstz.min.js'></script>
// <script src='https://s3-us-west-2.amazonaws.com/s.cdpn.io/3/moment.js'></script>
// <script src='https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.11/moment-timezone-with-data-2010-2020.min.js'></script>
function UserInfo() {
	//Load the current timezone
	if (!sessionStorage.getItem('timezone')) {
		var tz = jstz.determine() || 'UTC';
		sessionStorage.setItem('timezone', tz.name());
	}
	this.timezone = sessionStorage.getItem('timezone');

	// The timezone
	this.formattedTime = "";
	this.loadTime();
	setInterval(this.loadTime.bind(this), 60*1000); // Triggers every minute
}

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

	// getTimeZone(); // sets currTz
	// console.log("currTz: " + currTz);
	var tzTime = momentTime.tz(this.timezone);
	var formattedTime = tzTime.format('h:mm A');

	// console.log("formatted time: " + formattedTime);
	window.formattedTime = formattedTime;
	this.formattedTime = formattedTime;
	// localTime.textContent = "Time in " + currTz + ": " + formattedTime;
	// saveToFirebase(currTz);
}

// function saveToFirebase(timezone) {
// 	// console.log("saving to firebase")
// 	if(firebase.auth().currentUser === null) {
// 		// console.log("Unable to save to firebase due to the user not yet being authenticated");
// 		return;
// 	}
// 	// Make a firebase reference to the currentUser
// 	var myUID = firebase.auth().currentUser.uid;
// 	var userRef = firebase.database().ref('user-data/' + myUID);
// 	//Push updates
// 	var updates = {};
// 	updates['/timezone'] = timezone; // b
//
// 	userRef.update(updates);
// }
// console.log("got user info");
// loadTime();
// setInterval(loadTime, 60 * 1000); // update every minute
