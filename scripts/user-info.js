
// loads and saves the user's timezone
function getTimeZone {

    if (!sessionStorage.getItem('timezone')) {
        var tz = jstz.determine() || 'UTC';
        sessionStorage.setItem('timezone', tz.name());
    }
    var currTz = sessionStorage.getItem('timezone');
}

function loadTime() {
	var now = new Date;
	var hours;
	var minutes;
	if (now.getUTCHours() <= 9) {
		hours = "0" + now.getUTCHours(); 
	}
	
	else {
		hours = now.getUTCHours();
	}
	
	if (now.getUTCMinutes() <= 9) {
		minutes = "0" + now.getUTCMinutes();
	}
	
	else {
		minutes = now.getUTCMinutes();
	}
	
	console.log("Hours: " + hours);
	console.log("Minutes: " + minutes);
	
	var time = 	hours + ":" + minutes;
	console.log(time);
	convertTime(time);
}

function convertTime(theTime) {
	var date = moment().format("YYYY-MM-DD");
	var stamp = date + "T" + theTime + "Z";
	var momentTime = moment(stamp);

	var tzTime = momentTime.tz(currTz);
	var formattedTime = tzTime.format('h:mm A');

	console.log("formatted time: " + formattedTime);
	localTime.textContent = "Time in " + currTz + ": " + formattedTime;
}
loadTime();
setInterval(loadTime, 60*1000);