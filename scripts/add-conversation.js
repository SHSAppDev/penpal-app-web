
'use strict';

// Initializes AddConversation.
function AddConversation() {

  // Shortcuts to DOM Elements.
  this.addButton = document.getElementById('add-conversation-button');
  this.emailField = document.getElementById('email-field');
  this.$progress = $("#add-conversation .progress");
  this.$progress.css({display: 'none'});

  this.addButton.addEventListener('click', this.addConversationToDatabase.bind(this));

  this.initFirebase();
}

// A loading image URL.
AddConversation.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Sets up shortcuts to Firebase features and initiate firebase auth.
AddConversation.prototype.initFirebase = function() {
  // Initialize Firebase.
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));

};

AddConversation.prototype.addConversationToDatabase = function() {
  if(!this.auth.currentUser) { return; }
  var email = this.emailField.value;
  const ref = this.database.ref('user-data');
  ref.orderByChild('email')
    .equalTo(email)
    .once('value')
    .then(function (snapshot) {
      var value = snapshot.val();
      if (value) {
        // value is an object containing one or more of the users that matched your email query
        // choose a user and do something with it
        var uid = Object.keys(value)[0];
        console.log(value);
        // this.addUidToMyConversations(uid, value[uid].displayName);
        // this.addUidToOtherUsersConversations(uid);
        this.$progress.css({display: 'block'});
        const cmd = new Command();
        cmd.requestFunction("addConversation", {
          'recipientUID': uid
        }, {
          success: function(resp) {
            Materialize.toast(value[uid].displayName+" was added to your conversations!", 3000);
            this.emailField.value = "";
            this.$progress.css({display: 'none'});
          }.bind(this),
          error: function(err) {
            Materialize.toast("Uh oh! Something went wrong, try again later.");
            this.$progress.css({display: 'none'});
          }.bind(this)
        });
      } else {
        // window.alert("No user was found with that email: "+email);
        Materialize.toast("No user was found with that email: "+email, 3000);
      }
    }.bind(this));

};

// AddConversation.prototype.addUidToMyConversations = function(uid, displayName) {
//   var myConversationsRef = this.database.ref('user-data/'+this.auth.currentUser.uid+"/conversations");
//   myConversationsRef.push({
//     recipientUID: uid
//   }).then(function(){
//     // window.alert(displayName+" has been added to your conversations!");
//     Materialize.toast(displayName+" has been added to your conversations!", 3000);
//
//     this.emailField.value = "";
//   }.bind(this)).catch(function(error) {
//     // window.alert("Uh Oh. Something went wrong. The conversation wasn't added. Sry.")
//     Materialize.toast("Uh Oh. Something went wrong. The conversation wasn't added. Sry.", 3000);
//   });
// };
//
// AddConversation.prototype.addUidToOtherUsersConversations = function (uid) {
//   //@param uid = user id of the other user
//   var otherConversationRef = this.database.ref('user-data/'+uid+"/conversations");
//   otherConversationRef.push({
//     recipientUID: this.auth.currentUser.uid
//   });
// };


// Triggers when the auth state change for instance when the user signs-in or signs-out.
AddConversation.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!

  } else { // User is signed out!

    //In this case, I just take the user straight back to the login.
    window.location.href = 'login.html';
  }
};



new AddConversation();
