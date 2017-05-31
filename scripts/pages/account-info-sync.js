
'use strict';

// Initializes AccountInfoSync.
function AccountInfoSync() {
  firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
AccountInfoSync.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!

    //ASAP update the user's profile as much as you can
    this.userRef = firebase.database().ref('user-data/'+firebase.auth().currentUser.uid);
    var updates = {};
    updates['/displayName'] = firebase.auth().currentUser.displayName;
    updates['/email'] = firebase.auth().currentUser.email;
    updates['/photoURL'] = firebase.auth().currentUser.photoURL;
    updates['/uid'] = firebase.auth().currentUser.uid;
    this.userRef.update(updates);

    //This might be their first time using the app, so good to check
    this.userRef.child('registered').once('value', function(data){
      if(data.val() && data.val()===true) {
        //Already registered!!! Go on to the app!
        window.location.href = 'dashboard.html'
      } else {
        // Not yet registered. Unhide the content ui.
        document.getElementById('content').style.display = 'block';
        this.initForm();
      }
    }.bind(this));

  }
};

AccountInfoSync.prototype.initForm = function() {
  this.fullNameField = document.getElementById('full-name');
  this.emailField = document.getElementById('email');
  this.schoolCodeField = document.getElementById('school-code');
  this.submitButton = document.getElementById('submit-button');

  // Try to fill out as much as you can.
  this.fullNameField.value = firebase.auth().currentUser.displayName;
  this.emailField.value = firebase.auth().currentUser.email;
  Materialize.updateTextFields();

  this.submitButton.addEventListener('click', this.submit.bind(this));
};

AccountInfoSync.prototype.submit = function(){
  // -Validate field content
  // -Submit to firebase
  var submit = true;
  var err = null;
  if(!validateEmail(this.emailField.value)) {
    submit = false;
    err = "Invalid email."
    console.log('email invalid');
  }

  if(submit) {
    var updates = {}
    updates['/displayName'] = this.fullNameField.value;
    updates['/email'] = this.emailField.value;
    this.userRef.update(updates)
    this.command = new Command();
    this.command.requestFunction('registerInSchool',{
      'schoolCode': this.schoolCodeField.value
    }, {
      'success': function() {
        this.userRef.update({'/registered': true});
        window.location.href = 'dashboard.html';
      }.bind(this),
      'error': function(err) {
        window.alert('Some errror occured whilst trying to register for the school.')
      }.bind(this)
    });
  } else {
    window.alert('Error: '+err);
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

//https://stackoverflow.com/questions/46155/validate-email-address-in-javascript
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

window.onload = function() {
};

$(document).ready(function() {
    Materialize.updateTextFields();
    new AccountInfoSync();

});
