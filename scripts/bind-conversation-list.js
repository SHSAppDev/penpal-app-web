
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
    this.displayConversation(data.val().recipientUID, data.key);
  }
  this.myConversationsRef.on('child_added', setConversation.bind(this));
  this.myConversationsRef.on('child_changed', setConversation.bind(this));

};

// Template for conversation in conversation list.
LoadConversationList.CONVERSATION_TEMPLATE =
    '<a href=# class="collection-item avatar">' +
      '<span><img class="pic circle" src=#></span>' +
      '<span class="name title">Name</span>' +
      '<div class="active-indicator" hidden>' +
        '<div class="active-green-circle"></div><span>Online</span>' +
      '</div>' +
      '<span class="new badge">0</span>'+
    '</a>';


LoadConversationList.prototype.displayConversation = function(recipientUID, myConversationKey) {

  // this.userDataRef.child(recipientUID).once('value', function(snapshot){
  this.database.ref('user-data/'+recipientUID).once('value').then(function(snapshot){
    if(snapshot.val()===null) {return;}
    var div = document.getElementById(recipientUID);
    if(!div) {
      var container = document.createElement('div');
      container.innerHTML = LoadConversationList.CONVERSATION_TEMPLATE;
      div = container.firstChild;
      div.setAttribute('id', recipientUID);
      // console.log(this.conversationList);
      this.conversationList.appendChild(div);
    }
    div.href = 'dashboard.html?targetUID='+recipientUID;

    // Display name (displayName)
    div.querySelector('.name').textContent = snapshot.val().displayName;


    // Set recipient profile pic.
    var picURL = snapshot.val().photoURL !== null ? snapshot.val().photoURL : LoadConversationList.URL_PROFILE_PLACEHOLDER;
    div.querySelector('.pic').src = picURL;

    document.getElementById('conversations-preloader').style.display = "none";
    var unreadMessagesRef = this.database.ref('user-data/'+this.auth.currentUser.uid+'/conversations/'+myConversationKey+"/unreadMessages");
    unreadMessagesRef.off();
    unreadMessagesRef.on('value', function(dataSnapshot){
      var unreadMessages = dataSnapshot.val();
      // Display num of unread messages
      if(unreadMessages === null || unreadMessages === undefined || unreadMessages <= 0 || unreadMessages === '') {
        div.querySelector('.new').setAttribute('hidden', true);
      } else {
        div.querySelector('.new').removeAttribute('hidden');
        div.querySelector('.new').textContent = unreadMessages;
      }
    }.bind(this));

    //SYNC LIVE
    var presenceRef = this.database.ref('presence/'+recipientUID);
    presenceRef.off();
    presenceRef.on('value', function(snapshot){
      const live = snapshot.val();
      if(live){
        div.querySelector('.active-indicator').removeAttribute('hidden');
      } else {
        div.querySelector('.active-indicator').setAttribute('hidden', true);
      }
    }.bind(this));

  }.bind(this));

};

var conversationListID = document.currentScript.getAttribute('conversationListID');
new LoadConversationList(conversationListID);
