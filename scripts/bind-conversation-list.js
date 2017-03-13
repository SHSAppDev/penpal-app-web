
'use strict';

// Initializes the user's list of conversations from the firebase database
// and listens for changes.

function LoadConversationList(conversationListID) {
  document.getElementById('conversations-preloader').style.display = "block";
  this.conversationList = document.getElementById(conversationListID);
  if(this.conversationList == null) {
    window.alert("load-conversation-list.js: provide a conversationListID"+
    "attribute in the script tag. Otherwise this script dunno what to stick"+
    "the conversations onto :(");
  }

  this.initFirebase();
}

LoadConversationList.prototype.initFirebase = function() {
    // Shortcuts to Firebase SDK features.
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

LoadConversationList.prototype.onAuthStateChanged = function(user) {
    if (user) { // User is signed in!
      this.loadConversations();
    }
};

LoadConversationList.prototype.loadConversations = function() {
  this.myConversationsRef = this.database.ref('user-data/'+this.auth.currentUser.uid+'/conversations');
  this.myConversationsRef.off();
  var setConversation = function(data) {
    // Each item is a random key with a recipientUserID
    // console.log(this.displayConversation);
    this.displayConversation(data.val().recipientUID, data.val().unreadMessages);
  }
  this.myConversationsRef.on('child_added', setConversation.bind(this));
  this.myConversationsRef.on('child_changed', setConversation.bind(this));

};

// Template for conversation in conversation list.
// LoadConversationList.CONVERSATION_TEMPLATE =
//     '<a href=# class="collection-item">' +
//       '<span><img class="pic" src=#></span>' +
//       '<span class="name">Name</span>' +
//       '<span class="new badge">0</span>'+
//
//     '</a>';

LoadConversationList.CONVERSATION_TEMPLATE =
    '<a href=# class="collection-item avatar">' +
      '<span><img class="pic circle" src=#></span>' +
      '<span class="name title">Name</span>' +
      '<span class="new badge">0</span>'+

    '</a>';


LoadConversationList.prototype.displayConversation = function(recipientUID, unreadMessages) {

  // this.userDataRef.child(recipientUID).once('value', function(snapshot){
  this.database.ref('user-data/'+recipientUID).once('value').then(function(snapshot){
    if(snapshot.val()===null) {return;}

    var div = document.getElementById(recipientUID);
    if(!div) {
      var container = document.createElement('div');
      container.innerHTML = LoadConversationList.CONVERSATION_TEMPLATE;
      div = container.firstChild;
      div.setAttribute('id', recipientUID);
      // console.log(this.conversationList); //HELP
      this.conversationList.appendChild(div);
    }
    div.href = 'index.html?targetUID='+recipientUID;

    // Display name (displayName)
    div.querySelector('.name').textContent = snapshot.val().displayName;

    // Display num of unread messages
    if(unreadMessages === null || unreadMessages === undefined || unreadMessages <= 0 || unreadMessages === '') {
      div.querySelector('.new').setAttribute('hidden', true);
    } else {
      div.querySelector('.new').textContent = unreadMessages;
    }

    // Set recipient profile pic. TODO Make look nicer
    var picURL = snapshot.val().photoURL !== null ? snapshot.val().photoURL : LoadConversationList.URL_PROFILE_PLACEHOLDER;
    div.querySelector('.pic').src = picURL;

    document.getElementById('conversations-preloader').style.display = "none";


  }.bind(this));

  // this.database.ref('user-data/'+this.auth.currentUser.uid+'/conversations').once('value').then(function(snapshot){
  //   var val = snapshot.val();
  //
  // }.bind(this));
};

var conversationListID = document.currentScript.getAttribute('conversationListID');
new LoadConversationList(conversationListID);
