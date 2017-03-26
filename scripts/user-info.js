
// loads and saves the user's timezone
function saveTimeZone {

    if (!sessionStorage.getItem('timezone')) {
        var tz = jstz.determine() || 'UTC';
        sessionStorage.setItem('timezone', tz.name());
    }
    var currTz = sessionStorage.getItem('timezone');
}

