
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

  // More gross hacks! Stop the pre-loader from displaying if it's been a while.
  // console.log('gross hack!');
  setTimeout(function(){
    document.getElementById('conversations-preloader').style.display = "none";
    // console.log("Preloader hidden");
  }.bind(this), 2000);

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
    '<a href=# class="collection-item avatar" style="overflow: hidden;">' +
      '<span><img class="pic circle" src=#></span>' +
      '<span class="name title" style="color:black">Name</span>' +
      '<div class="active-indicator" hidden>' +
        '<div class="active-green-circle"></div><span class="translate">Online</span>' +
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
      this.sortConversations();
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
        div.querySelector('.name').style.fontWeight = "bold";
      }
      this.sortConversations();
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
      this.sortConversations();
    }.bind(this));

  }.bind(this));

};

LoadConversationList.prototype.sortConversations = function(){
  var allConversations = $(this.conversationList).children();
  // var rankings = [];
  // console.log('sort conversations '+stringObjRecursive(allConversations));
  // RANKING SYSTEM
  // +100 points for each unread message
  // TODO +10 points for every (10 - number of days since last message or bell ring)
  // +1 point for being online (active indicator is visible)
  for(var i=0; i<allConversations.length; i++) {
    const conv = allConversations[i];
    var ranking = 0;
    const unreadMessages = parseInt(conv.querySelector('.new').innerHTML);
    ranking += 100*unreadMessages;

    const activeIndicator = conv.querySelector('.active-indicator');
    if(activeIndicator && !activeIndicator.getAttribute('hidden')) {
      ranking += 1;
    }
    conv.ranking = ranking;
  }

  // now, time to actually sort the conversations

  // Sort alphabetically
  allConversations.sort(function(a, b) {
      var splitA = a.querySelector('.name').textContent.toUpperCase().split(" ");
      var splitB = b.querySelector('.name').textContent.toUpperCase().split(" ");
      var textA = splitA[splitA.length-1];
      var textB = splitB[splitB.length-1];
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
  });

  // by ranking
  allConversations.sort(function(a, b){ return b.ranking - a.ranking });

  $(this.conversationList).empty();
  for(var i=0; i<allConversations.length; i++) {
    this.conversationList.appendChild(allConversations[i]);
  }
  // this.conversationList.appendChild(allConversations);
};

function objValues(obj) {
  return Object.keys(obj).map(function(key){
    return obj[key];
  });
}

function objContainsVal(obj, val) {
  const vals = objValues(obj);
  for(var i=0; i<vals.length; i++) {
    if(vals[i] === val) return true;
  }
  return false;
}

// Creates a string version of any object that shows all key and value pairs.
function stringObj(obj) {
  const keys = Object.keys(obj);
  const vals = objValues(obj);
  var str = '';
  for(var i=0; i<keys.length; i++) {
    str += keys[i]+': '+vals[i]+'\n';
  }
  return str;
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


var conversationListID = document.currentScript.getAttribute('conversationListID');
new LoadConversationList(conversationListID);
