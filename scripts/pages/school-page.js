
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
    this.command = new Command();
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

        const addConvButton = listItem.querySelector('a.add-conv-button');
        addConvButton.id = 'add-conv-button-'+each.uid;
        const addConvButtonIcon = listItem.querySelector('a.add-conv-button i');
        const loader = listItem.querySelector('div.loader-red-small');
        if(this.IAlreadyHaveConversationWith(each.uid)) { //TODO reneable when done testing.
          addConvButton.setAttribute('disabled', true);
          addConvButtonIcon.innerHTML = 'check';
        } else {
          console.log('adding click event for addConvButton');
          $(addConvButton).click(function(){
            console.log('clicked! '+addConvButton.id);
            addConvButton.style.display = 'none';
            loader.style.display = 'block';
            this.command.requestFunction('addConversation',{recipientUID: each.uid},
            {
              success: function(resp) {
                loader.style.display = 'none';
                addConvButton.style.display = 'block';
                addConvButton.setAttribute('disabled', true);
                addConvButtonIcon.innerHTML = 'check';
                Materialize.toast('Conversation successfully added!', 2000);
              }.bind(this),
              error: function(err) {
                loader.style.display = 'none';
                addConvButton.style.display = 'block';
                Materialize.toast('There was an error in adding the conversation.', 2000);
              }.bind(this)
            });
          }.bind(this));
        }


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
      '<div style="float: left">' +
      // '<a class="anchor" href=#>' +
        '<img src=# class="circle photo"></img>' +
        '<span class="title display-name">Alvin</span>' +
        '<p class="email"></p>' +
      // '</a>' +
      '</div>' +
      '<a class="add-conv-button btn-floating btn-medium waves-effect waves-light red" style="float: right"><i class="material-icons">person_add</i></a>' +
      '<div class="loader-red-small" style="float: right; display: none"></div>'
    '</li>';


// tells us if our current user already has a conversation with the specified uid
// this.myProfile must be defined before the function is called.
SchoolPage.prototype.IAlreadyHaveConversationWith = function(uid) {
  const obj = this.myProfile.conversations;
  const conversations = obj?Object.values(obj):[];
  for(var i=0; i<conversations.length; i++) {
    const conv = conversations[i];
    if(conv.recipientUID == uid) return true;
  }
  return false;
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
  new SchoolPage();
};
