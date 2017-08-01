
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

  // console.log(stringObj({
  //   a: 'b',
  //   c: {
  //     a: 'b',
  //     c: 'd'
  //   },
  //   d: {
  //     x: 'y'
  //   }
  // }));
};

AccountInfoSync.prototype.submit = function(){
  // -Validate field content
  // -Submit to firebase
  // var submit = true;
  var err = null;
  if(validateEmail(this.emailField.value)) {
    var updates = {}
    updates['/displayName'] = this.fullNameField.value;
    updates['/email'] = this.emailField.value;
    this.userRef.update(updates);
    if(this.schoolCodeField.value) {
      this.command = new Command();
      this.command.requestFunction('registerInSchool', {
        'schoolCode': this.schoolCodeField.value
      },
      {
        'success': function(result) {
          this.success();
        }.bind(this),
        'error': function(err) {
          this.fail('Some error occurred while trying to register for the school.');
        }.bind(this)
      });
    } else {
      this.success();
    }
  } else {
    this.fail('Invalid email.');
  }
};

AccountInfoSync.prototype.success = function() {
  // Set the user's registered property to true, and move on to the dashboard.
  this.userRef.update({'/registered':true}).then(function(){
    window.location.href = 'dashboard.html';
  }.bind(this));

}

AccountInfoSync.prototype.fail = function(message) {
  // Display something to the user to indicate to them what is wrong with their form.
  //TODO write something better.
  window.alert(message)
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
