
'use strict';

// Initializes SchoolPage.
function SchoolPage() {
  // this.schoolCodeInput = document.getElementById('school-code-input');
  // this.searchButton = document.getElementById('search-button');
  // this.searchButton.addEventListener('click', function(){
  //   this.initializeAllOptions(this.schoolCodeInput.value);
  // }.bind(this));
  this.optionsContainer = document.getElementById('users-container');
  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
SchoolPage.prototype.initFirebase = function() {
  // Initialize Firebase.
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};



// Triggers when the auth state change for instance when the user signs-in or signs-out.
SchoolPage.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // firebase.database().ref('schools').once('value', function(data){
    //   console.log('all schools '+data.val())
    // }.bind(this));
    firebase.database().ref('user-data/'+firebase.auth().currentUser.uid)
      .once('value', function(snapshot){
        this.myProfile = snapshot.val();
        const schoolCode = this.myProfile.schoolCode;
        if(schoolCode) {
          // The user has an associated school. Site can proceed normally.
          document.getElementById('body').style.display = 'block';
          this.initializeAllOptions(schoolCode);
        } else {
          // Uh Oh, there is no school code. Must redirect user to place where they can enter a school code.
          window.location.href = 'account-info-sync.html?editProfile=true'+
            '&message=Please enter your school code to be able to view potential contacts.';
        }
    }.bind(this));
  }
};

SchoolPage.prototype.initializeUserListForGivenSchool = function(schoolCode) {
  firebase.database().ref('schools/'+schoolCode)
  .once('value',function(data){
    if(data.val()) {
      var temp = document.createElement('div');
      temp.innerHTML = SchoolPage.SCHOOL_LIST_TEMPLATE;
      const schoolListElement = temp.firstChild;
      schoolListElement.id = schoolCode;
      schoolListElement.querySelector('.school-name').textContent = data.val().name;
      this.optionsContainer.appendChild(schoolListElement);

      const userObjs = data.val().students?Object.values(data.val().students):[];
      const listItems = [];
      for(var i=0; i<userObjs.length; i++) {
        const each = userObjs[i];
        if(each.uid == firebase.auth().currentUser.uid) continue;
        var temp = document.createElement('div');
        temp.innerHTML = SchoolPage.USER_LIST_ITEM;
        var listItem = temp.firstChild;
        listItem.querySelector('.display-name').textContent = each.displayName;
        listItem.querySelector('.photo').src = each.photoURL;
        listItem.querySelector('.email').textContent = each.email;

        listItems[i] = listItem;
      }

      // Sort alphabetically
      listItems.sort(function(a, b) {
          var splitA = a.querySelector('.display-name').textContent.toUpperCase().split(" ");
          var splitB = b.querySelector('.display-name').textContent.toUpperCase().split(" ");
          var textA = splitA[splitA.length-1];
          var textB = splitB[splitB.length-1];
          return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
      });

      // Now add to the school list element.
      for(var i=0; i<listItems.length; i++) {
        schoolListElement.appendChild(listItems[i]);
      }

    } else {
      window.alert("There were no schools found with that code.");
    }
  }.bind(this));
};

// Displays all the users associated with this school and all the users of the schools assocated for this given school.
SchoolPage.prototype.initializeAllOptions = function(schoolCode) {
  this.optionsContainer.innerHTML = "";
  this.initializeUserListForGivenSchool(schoolCode);
  firebase.database().ref('schools/'+schoolCode+'/associatedSchools')
    .once('value', function(data){
      if(data.val()===null)return;
      const associatedSchoolCodes = Object.values(data.val());
      // console.log('associatedSchoolCodes '+associatedSchoolCodes);
      for(var i=0; i<associatedSchoolCodes.length; i++) {
        this.initializeUserListForGivenSchool(associatedSchoolCodes[i]);
      }
    }.bind(this));
};

SchoolPage.SCHOOL_LIST_TEMPLATE =
  '<ul class="collection with-header">' +
  '<li class="collection-header"><h4 style="text-align:center; height: auto; font-size: 30px; color: black" class="school-name">School Name</h4></li>' +
  '</ul>';
SchoolPage.USER_LIST_ITEM =
    '<li class="collection-item avatar">' +
    '<div>' +
    // '<a class="anchor" href=#>' +
    '<img src=# class="circle photo"></img>' +
    '<span class="title display-name">Alvin</span>' +
    '<p class="email"></p>' +
    // '</a>' +
    '</div>' +
    '</li>';

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
  new SchoolPage();
};
