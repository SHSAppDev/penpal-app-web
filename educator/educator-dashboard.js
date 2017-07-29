
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

new EducatorDashboard();
