
'use strict';

// Initializes AccountInfoSync.
function AccountInfoSync() {
  firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
AccountInfoSync.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!

    //ASAP update the user's profile as much as you can
    const userRef = firebase.database().ref('user-data/'+firebase.auth().currentUser.uid);
    var updates = {};
    updates['/displayName'] = firebase.auth().currentUser.displayName;
    updates['/email'] = firebase.auth().currentUser.email;
    updates['/photoURL'] = firebase.auth().currentUser.photoURL;
    updates['/uid'] = firebase.auth().currentUser.uid;
    userRef.update(updates);

    //This might be their first time using the app, so good to check
    userRef.child('registered').once('value', function(data){
      if(data.val() && data.val()===true) {
        //Already registered!!! Go on to the app!
        window.location.href = 'dashboard.html'
      } else {
        // Not yet registered. Unhide the content ui.
        document.getElementById('content').style.display = 'block';

      }
    }.bind(this));

  }
};

// Stolen from stack overflow. Useful!
// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

window.onload = function() {
};

$(document).ready(function() {
    Materialize.updateTextFields();
    new AccountInfoSync();

});
