
'use strict';
 console.log("The dashboard");
// Initializes WWBDashboard.
function WWBDashboard() {

    // Shortcuts to DOM Elements.
    this.userPic = document.getElementById('user-pic');
    this.userName = document.getElementById('user-name');
    this.sendNotificationButton = document.getElementById('send-notification');
    this.sendNotificationButton.addEventListener('click', this.sendNotificationEmail.bind(this));
    this.initFirebase();
    this.translate = new EZTranslate();
    this.command = new Command();
    this.targetUID = getParameterByName('targetUID');
    firebase.database().ref('user-data/'+targetUID).once('value',
      function(snapshot){
        this.recipientProfile = snapshot.val();
        $('#bell-modal h4 > span').html(this.recipientProfile.displayName);
        console.log('changed name');
    }.bind(this));


    // this.userInfo = new UserInfo();

    // Example of how to do the translate:
    // translate method takes in sourceLang, targetLang, sourceText, and a callBack
    // Here I do English to Spanish
    // this.translate.translate("en", "es", "What's up?", function(translatedText){
    //     console.log("translatedText: "+translatedText);
    // });

}


WWBDashboard.URL_PROFILE_PLACEHOLDER = '/images/profile_placeholder.png';
WWBDashboard.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';


// Sets up shortcuts to Firebase features and initiate firebase auth.
WWBDashboard.prototype.initFirebase = function() {
    // Initialize Firebase.
    // Shortcuts to Firebase SDK features.
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    // Initiates Firebase auth and listen to auth state changes.
    this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));


};

// Checks if the given userID is registered in user-data, and if it's not,
// the userID gets registered
// WWBDashboard.prototype.checkForFirstTimeUser = function(userId) {
//   var userRef = this.database.ref('user-data/'+userId);
//   userRef.once('value', function(snapshot) {
//     if(snapshot.val() === null
//     || snapshot.val().registered == false
//     || snapshot.val().registered == null
//     || snapshot.val().registered == undefined) {
//       // We have ourselves a first time user!
//       // console.log("this="+this);
//       userRef.set({
//         email: this.auth.currentUser.email,
//         displayName: this.auth.currentUser.displayName,
//         photoURL: this.auth.currentUser.photoURL || WWBDashboard.URL_PROFILE_PLACEHOLDER,
//         registered: true
//       });
//     }
//   }.bind(this));
// }

// Triggers when the auth state change for instance when the user signs-in or signs-out.
WWBDashboard.prototype.onAuthStateChanged = function(user) {
    if (user) { // User is signed in!
        //First, check for first time user.
        // console.log("on auth change");
        // this.checkForFirstTimeUser(this.auth.currentUser.uid);

        firebase.database().ref('user-data/'+firebase.auth().currentUser.uid).once('value',
          function(snapshot){
            this.myProfile = snapshot.val();
            // Unhide and set userName
            this.userName.removeAttribute('hidden');
            this.userName.innerHTML = this.myProfile.displayName;
        }.bind(this));

        // Get profile pic and user's name from the Firebase user object.
        var profilePicUrl = user.photoURL; // Get profile pic.
        // var userName = user.displayName;        // Get user's name.

        // Set the user's profile pic and name.
        this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
        // this.userName.textContent = userName;

        // Show user's profile and sign-out button.
        // this.userName.removeAttribute('hidden');
        this.userPic.removeAttribute('hidden');


        //presence
        new Presence();

    }
};

WWBDashboard.prototype.sendNotificationEmail = function(){
    console.log("sending notification");

    document.getElementById('send-notification-progress').style.display = 'block';
    this.sendNotificationButton.setAttribute('DISABLED', true);
    this.command.requestFunction('sendEmail', {
        'emailAddress': this.recipientProfile.email,
        'subject': this.myProfile.displayName+" has rung the bell!",
        'text': "Don't keep your penpal waiting! Log onto http://worldwithoutborders.ml/ and keep your conversation going!"
    }, {
        'success': function(resp){
          window.alert('Thanks for ringing the bell! An email was sent to '+this.recipientProfile.displayName+'.');
          $('#bell-modal').modal('close');
          document.getElementById('send-notification-progress').style.display = 'none';
          this.sendNotificationButton.removeAttribute('DISABLED');
        }.bind(this),
        'error': function(resp){
          window.alert("Some error occurred while trying to send the email :(");
          document.getElementById('send-notification-progress').style.display = 'none';
          this.sendNotificationButton.removeAttribute('DISABLED');
        }.bind(this)
    });
}

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
    window.dashboardScript = new WWBDashboard();
    // document.getElementById('button-collapse').sideNav(); //DISABLED because js says sideNav() isn't a function.
};

(function($) {
    $(function() {
        $('.button-collapse').sideNav();
        $('select').material_select();
        $('.materialboxed').materialbox();
        // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
        $('.modal').modal();
    }); // end of document ready
})(jQuery); // end of jQuery name space
