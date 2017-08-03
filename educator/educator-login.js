
const database = firebase.database();
const auth = firebase.auth();

// Meant to handle just regular logins NOT account creation. THat's the next class
function EducatorLogin() {
  const loginForm = document.getElementById('login-form');
  this.loginCard = document.getElementById('login-card');

  document.getElementById('login-btn').addEventListener('click', function(){
    this.responses = renderForm(loginForm);
    const email = this.responses['email-address'];
    const password = this.responses['password'];
    // login
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      $('.btn').attr('disabled', false);
      $('#login-card .progress').css('display', 'none');
      // TODO be more specific in messages.
      Materialize.toast("Something went wrong while trying to log in! :(", 4000);
    });
    // Stuff to make ui look nice
    $('.btn').attr('disabled', true);
    $('#login-card .progress').css('display', 'block');

  }.bind(this));

  auth.onAuthStateChanged(function(user){
    if(user) {
      // We're signed in! Do some quick info sync.
      console.log('signed in!');
      // change page to dashboard
      window.location.href = './educator-account-info-sync.html';
    }
  }.bind(this));

  monitorFormIsFull(loginForm);


}

// This class is meant to handle just the account creation scenario.
function EducatorCreateAccount() {
  const createAccountForm = document.getElementById('create-account-form');
  this.createAccountCard = document.getElementById('create-account-card');
  document.getElementById('create-account-btn').addEventListener('click', function(){
    this.responses = renderForm(createAccountForm);
    // console.log(stringObjRecursive(this.responses));
    const email = this.responses['email-address'];
    const password = this.responses['password'];
    auth.createUserWithEmailAndPassword(email, password).catch(function(error) {
       var errorCode = error.code;
       var errorMessage = error.message;
       console.log(error);
       var msg = "Uh oh, something's up! An error ocurred whilst trying to create your account.";
       if(errorCode === 'auth/weak-password') {
         msg = "Your password should be at least 6 characters." // TODO make display as tooltip
       }
       Materialize.toast(msg, 4000);
       $('.btn').attr('disabled', false);
       $('#create-account-card .progress').css('display', 'none');
    }.bind(this));
    //Stuff that looks nice.
    $('.btn').attr('disabled', true);
    $('#create-account-card .progress').css('display', 'block');
    console.log('creating account');
  }.bind(this));

  auth.onAuthStateChanged(function(user){
    if(user) {
      // We're signed in! Do some quick info sync.
      console.log('signed in! Doing info sync.')
      var myData = {};
      myData['email'] = auth.currentUser.email;
      myData['schoolName'] = this.responses['school-name'];
      database.ref('educator-data/'+auth.currentUser.uid).set(myData)
        .then(function(){
          // And now we're good Lessgo!
          window.location.href = "./educator-account-info-sync.html";
        }.bind(this));
    }
  }.bind(this));

  monitorFormIsFull(createAccountForm);
}


function renderForm(form) {
  // Returns an object where the keys are the input names and the values
  // are the values that the user inputted. Useful to me 😏
  var resp = {};
  const elements = form.elements;
  for(var i=0; i<elements.length; i++) {
    const input = elements[i];
    resp[input.name] = input.value;
  }
  return resp;
}

function monitorFormIsFull(form) {
  // Makes sure ALL fields in form contain SOMETHING. Disables all elements
  // with .btn class if just one field is empty.
  var $inputs = $(form).find('input');
  $inputs.keyup(function(){
    var full = true;
    $inputs.each(function(){
      if($(this).val() === '') {
        full = false;
      }
    });
    var $btn = $(form).find('.btn');
    if(full) {
      $btn.removeAttr('disabled');
      // console.log('remove disabled');
    } else {
      $btn.attr('disabled', 'disabled');
      // console.log('set disable true');
    }
  });
}

// Creates a string version of any object that shows all key and value pairs.
// This recursive version will show the string versions of objects as values.
// e.g. {a: b, c: { a: b }}
function stringObjRecursive(obj, indentLevel) {
  const keys = Object.keys(obj);
  const vals = keys.map(function(key) {
    return obj[key];
  });
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

new EducatorCreateAccount();
new EducatorLogin();
