
'use strict';

function EducatorDashboard() {
  this.database = firebase.database();
  this.auth = firebase.auth();
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));

  document.getElementById('sign-out')
    .addEventListener('click', this.signOut.bind(this));
  document.getElementById('sign-out-mobile')
    .addEventListener('click', this.signOut.bind(this));
  this.usersContainer = document.getElementById('users-container');
  this.addSchoolForm = document.getElementById('add-school-form');
  this.command = new Command();
}

EducatorDashboard.prototype.onAuthStateChanged = function(user) {
  if(user) {
    this.database.ref('educator-data/'+this.auth.currentUser.uid).once('value', function(snapshot){
      this.myData = snapshot.val();
      const schoolName = this.myData.schoolName;
      const schoolCode = this.myData.schoolCode;
      document.getElementById('school-name').innerHTML = schoolName;
      document.getElementById('school-code').innerHTML = schoolCode;

      // Show user list
      this.initializeUserListForGivenSchool(schoolCode);

      monitorFormIsFull(this.addSchoolForm);
      // Allow adding of schools
      $('#add-btn').click(this.addAssociateSchool.bind(this));

      // Unhide body.
      $('body').css('display', 'block');

    }.bind(this));
  } else {
    // Signed out
    window.location.href = './educator-login.html';
  }
};

EducatorDashboard.prototype.signOut = function() {
  this.auth.signOut();
};

EducatorDashboard.prototype.addAssociateSchool = function(){
  var resp = renderForm(this.addSchoolForm);
  const input_schoolCode = resp['school-code'];
  console.log('addAssociateSchool called.')
  // const my_schoolCode = this.myData.schoolCode;
  // const mySchoolRef = this.database.ref('schools/'+my_schoolCode);
  $('#add-school-modal .progress').css('display', 'block');
  $('#add-school-modal .btn').attr('disabled', 'disabled');

  this.command.requestFunction('addAssociateSchool', {
    'schoolCode': input_schoolCode
  }, {
    'success': function(resp) {
      Materialize.toast(resp, 4000);
      $('#add-school-modal .progress').css('display', 'none');
      $('#add-school-modal .btn').removeAttr('disabled');

    }.bind(this),

    'error': function(err) {
      Materialize.toast(err, 5000);
      $('#add-school-modal .progress').css('display', 'none');
      $('#add-school-modal .btn').removeAttr('disabled');

    }.bind(this)
  });
};

EducatorDashboard.prototype.initializeUserListForGivenSchool = function(schoolCode) {
  firebase.database().ref('schools/'+schoolCode)
  .once('value',function(data){
    if(data.val()) {
      var temp = document.createElement('div');
      temp.innerHTML = EducatorDashboard.SCHOOL_LIST_TEMPLATE;
      const schoolListElement = temp.firstChild;
      schoolListElement.id = schoolCode;
      schoolListElement.querySelector('.school-name').textContent = data.val().name;
      this.usersContainer.appendChild(schoolListElement);

      const userObjs = data.val().students?Object.values(data.val().students):[];
      for(var i=0; i<userObjs.length; i++) {
        const each = userObjs[i];
        if(each.uid == firebase.auth().currentUser.uid) continue;
        var temp = document.createElement('div');
        temp.innerHTML = EducatorDashboard.USER_LIST_ITEM;
        var listItem = temp.firstChild;
        listItem.querySelector('.display-name').textContent = each.displayName;
        listItem.querySelector('.photo').src = each.photoURL;
        listItem.querySelector('.email').textContent = each.email;

        schoolListElement.appendChild(listItem);
      }
    } else {
      window.alert("There were no schools found with that code.");
    }
  }.bind(this));
};

EducatorDashboard.SCHOOL_LIST_TEMPLATE =
  '<ul class="collection with-header">' +
    '<li class="collection-header"><h4 class="school-name">School Name</h4></li>' +
  '</ul>';
EducatorDashboard.USER_LIST_ITEM =
  '<li class="collection-item avatar">' +
    '<div>' +
      '<img src=# class="circle photo"></img>' +
      '<span class="title display-name">Alvin</span>' +
      '<p class="email"></p>' +
    '</div>' +
  '</li>';

(function($) {
    $(function() {
        $('.button-collapse').sideNav();
        $('select').material_select();
        $('.materialboxed').materialbox();
        // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
        $('.modal').modal();
    }); // end of document ready
})(jQuery); // end of jQuery name space

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

new EducatorDashboard();
