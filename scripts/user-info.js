// loads and saves the user's timezone

var currTz;

function getTimeZone() {
	if (!sessionStorage.getItem('timezone')) {
		var tz = jstz.determine() || 'UTC';
		sessionStorage.setItem('timezone', tz.name());
	}
	currTz = sessionStorage.getItem('timezone');
}

function loadTime() {
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
	convertTime(time);
}

function convertTime(theTime) {
	// console.log("Converting time");
	var date = moment().format("YYYY-MM-DD");
	var stamp = date + "T" + theTime + "Z";
	var momentTime = moment(stamp);

	getTimeZone(); // sets currTz
	// console.log("currTz: " + currTz);
	var tzTime = momentTime.tz(this.currTz);
	var formattedTime = tzTime.format('h:mm A');

	// console.log("formatted time: " + formattedTime);
	window.formattedTime = formattedTime;
	// localTime.textContent = "Time in " + currTz + ": " + formattedTime;
	saveToFirebase(currTz);
}

function saveToFirebase(timezone) {
	// console.log("saving to firebase")
	if(firebase.auth().currentUser === null) {
		// console.log("Unable to save to firebase due to the user not yet being authenticated");
		return;
	}
	// Make a firebase reference to the currentUser
	var myUID = firebase.auth().currentUser.uid;
	var userRef = firebase.database().ref('user-data/' + myUID);
	//Push updates
	var updates = {};
	updates['/timezone'] = timezone; // b

	userRef.update(updates);
}
// console.log("got user info");
loadTime();
setInterval(loadTime, 60 * 1000); // update every minute
