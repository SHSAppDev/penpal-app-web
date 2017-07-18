
'use strict';

// Initializes AccountInfoSync.
function AccountInfoSync() {
  this.editProfile = getParameterByName('editProfile');
  firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
AccountInfoSync.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!

    this.userRef = firebase.database().ref('user-data/'+firebase.auth().currentUser.uid);

    if(!this.editProfile) {
      //ASAP update the user's profile as much as you can.
      var updates = {};
      updates['/displayName'] = firebase.auth().currentUser.displayName;
      updates['/email'] = firebase.auth().currentUser.email;
      updates['/photoURL'] = firebase.auth().currentUser.photoURL;
      updates['/uid'] = firebase.auth().currentUser.uid;
      this.userRef.update(updates);
    }


    //This might be their first time using the app, so good to check
    this.userRef.child('registered').once('value', function(data){
      if(!this.editProfile && data.val() && data.val()===true) {
        //Already registered!!! Go on to the app!
        window.location.href = 'dashboard.html'
      } else {
        // Not yet registered. Or the profile is being editted. Unhide the content ui.
        document.getElementById('content').style.display = 'block';
        this.initForm();

        //UI tweaks if profile is simply being editted.
        document.getElementById('welcome-text').style.display = 'none';
        document.getElementById('submit-button').innerHTML = 'Save';

        //Might we also need to display a special message?
        const message = getParameterByName('message');
        if(message) {
          //TODO display the message in a much more appropriately-style material design way.
          window.alert(message);
        }

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
  if(this.editProfile) {
    // In the case of a profile edit, everything will be pre-filled with stuff stored in user-data
    firebase.database().ref('user-data/'+firebase.auth().currentUser.uid)
      .once('value', function(snapshot){
      console.log(snapshot.val());
      this.fullNameField.value = snapshot.val().displayName;
      this.emailField.value = snapshot.val().email;
      this.schoolCodeField.value = snapshot.val().schoolCode?snapshot.val().schoolCode:'';
      Materialize.updateTextFields();
      this.saveInitialValues();
    }.bind(this));
  } else {
    this.fullNameField.value = firebase.auth().currentUser.displayName;
    this.emailField.value = firebase.auth().currentUser.email;
    Materialize.updateTextFields();
    this.saveInitialValues();
  }

  this.submitButton.addEventListener('click', this.submit.bind(this));
};

AccountInfoSync.prototype.saveInitialValues = function() {
  this.initValues = {}; // Will contain initial values of each field
  this.initValues['full-name'] = this.fullNameField.value;
  this.initValues['email'] = this.emailField.value;
  this.initValues['school-code'] = this.schoolCodeField.value;
};


AccountInfoSync.prototype.submit = function() {
  // Know what to update based on if the field values changed.
  // Tell update manager which processes must be completed in order for the profile to have been successfully modified.
  // Do each process, telling update manager each time one has been finished. Update manager should, once all aare
  // finished set the user's registered propery to true and go to the dashboard.
  document.getElementById('progress-bar').style.display = 'block';
  var updateManager = new ProfileUpdateManager(['simple']);
  if(!validateEmail(this.emailField.value)) {
    this.fail('Invalid email address.');
    return;
  }

  var updates = {};
  if(this.initValues['full-name'] !== this.fullNameField.value) {
    updates['/displayName'] = this.fullNameField.value;
  }

  if(this.initValues['email'] !== this.emailField.value) {
    updates['/email'] = this.emailField.value;
  }

  // The 'Simple' process refers to the things that can be updated with a simple call of update.
  this.userRef.update(updates).then(function(){
    updateManager.processDone('simple');
  }.bind(this));

  if(this.initValues['school-code'] !== this.schoolCodeField.value) {
    updateManager.processes['schoolRegistration'] = false;
    this.command = new Command();
    this.command.requestFunction('registerInSchool', {
      'schoolCode': this.schoolCodeField.value
    },
    {
      'success': function(result) {
        updateManager.processDone('schoolRegistration');
      }.bind(this),
      'error': function(err) {
        this.fail('Some error occurred while trying to register for the school.');
      }.bind(this)
    });
  }

  // if(validateEmail(this.emailField.value)) {
  //   var updates = {}
  //   updates['/displayName'] = this.fullNameField.value;
  //   updates['/email'] = this.emailField.value;
  //   this.userRef.update(updates);
  //   if(this.schoolCodeField.value) {
  //     this.command = new Command();
  //     this.command.requestFunction('registerInSchool', {
  //       'schoolCode': this.schoolCodeField.value
  //     },
  //     {
  //       'success': function(result) {
  //         this.success();
  //       }.bind(this),
  //       'error': function(err) {
  //         this.fail('Some error occurred while trying to register for the school.');
  //       }.bind(this)
  //     });
  //   } else {
  //     this.success();
  //   }
  // } else {
  //   this.fail('Invalid email.');
  // }
};

function ProfileUpdateManager(processNames) {
  // Object to help profile updates. Ensures page is not exited until every single
  // part of the user's profile is successfully updated.
  // In processes object, false indicates an unfinished process.
  this.processes = {};
  for(var i=0; i<processNames.length; i++) {
    this.processes[processNames[i]] = false;
  }
}
ProfileUpdateManager.prototype.processDone = function(processName) {
  this.processes[processName] = true;
  // See if there are any other unfinished processes.
  if(Object.values(this.processes).indexOf(false) > -1) {
    // Unfinied processes left.
    return;
  } else {
    // Everything's done!
    // Set the user's registered property to true, and move on to the dashboard.
    this.userRef = firebase.database().ref('user-data/'+firebase.auth().currentUser.uid);
    this.userRef.update({'/registered':true}).then(function(){
      window.location.href = 'dashboard.html';
    }.bind(this));
  }
};

// AccountInfoSync.prototype.success = function() {
//   // Set the user's registered property to true, and move on to the dashboard.
//   this.userRef.update({'/registered':true}).then(function(){
//     window.location.href = 'dashboard.html';
//   }.bind(this));
//
// };

AccountInfoSync.prototype.fail = function(message) {
  // Display something to the user to indicate to them what is wrong with their form.
  //TODO write something better.
  window.alert(message);
  document.getElementById('progress-bar').style.display = 'none';
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

function stringObj(obj, indentLevel) {
  const keys = Object.keys(obj);
  const vals = Object.values(obj);
  var indents;
  if(indentLevel) {
    indents = indentLevel;
  } else {
    indents = 0;
  }

  var str = '';
  for(var i=0; i<keys.length; i++) {
    for(var j=0; j<indents; j++) {
      str += '   ';
    }
    if(vals[i] instanceof Object) {
      str += keys[i]+': {\n'+stringObj(vals[i], indents+1)+'}\n';
    } else {
      str += keys[i]+': '+vals[i]+'\n';
    }
  }
  return str;
}

$(document).ready(function() {
    Materialize.updateTextFields();
    new AccountInfoSync();

});
