
'use strict';

// Initializes StatSummary.
function StatSummary() {
  this.initFirebase();
  // httpGetAsync("https://us-central1-penpalapp-6020c.cloudfunctions.net/helloWorld", function(resp){
  //   console.log(response);
  // });

}

// Sets up shortcuts to Firebase features and initiate firebase auth.
StatSummary.prototype.initFirebase = function() {
  // Initialize Firebase.
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};



// Triggers when the auth state change for instance when the user signs-in or signs-out.
StatSummary.prototype.onAuthStateChanged = function(user) {
  if (user) {
    const paramUID = getParameterByName('uid');
    this.forSelf = paramUID === null || paramUID === '' || paramUID === this.auth.currentUser.uid;
    this.myUid = this.forSelf ? this.auth.currentUser.uid : paramUID;
    this.loadConversationStats() //WooHoo!

    // Also load own profile or profile of target user
    this.database.ref('user-data/'+this.myUid).once('value', function(data){
      // const myProfile = document.getElementById('my-profile');
      document.getElementById('display-name').textContent = data.val().displayName;
      document.getElementById('email').textContent = data.val().email;
      document.getElementById('profile-pic').src = data.val().photoURL;
      document.getElementById('user-card').style.display="flex";

    }.bind(this));

  }
};

StatSummary.prototype.loadConversationStats = function() {
  this.database.ref('user-data/'+this.myUid+'/conversations').once('value', function(data) {
    if(data.val()===null) return;
    const recipientUIDs = Object.values(data.val()).map(function(convContainer){
      return convContainer.recipientUID;
    });
    // recipientUIDs is an array containing all the uids that the user has conversations with
    // now, I loop through them all and somehow get all the necessary data bits.
    for(var i=0; i<recipientUIDs.length; i++) {
      new ConvStatElementMachine(recipientUIDs[i], this.myUid);
    }
  }.bind(this));
}

function ConvStatElementMachine(targetUID, myUid) {
  this.obj = {};
  this.targetUID = targetUID;
  this.myUid = myUid;
  const uid = targetUID;
  firebase.database().ref('user-data/'+uid).once('value', function(user){
    const displayName = user.val().displayName;
    const email = user.val().email;
    const photoURL = user.val().photoURL;
    this.addComponent('displayName', displayName);
    this.addComponent('email', email);
    this.addComponent('photoURL', photoURL);
  }.bind(this));
  const convKey = uid > this.myUid ? uid+this.myUid : this.myUid+uid;
  firebase.database().ref('conversations/'+convKey).once('value', function(conversation){
    // console.log('conversation '+Object.values(conversation.val()));
    const messageObjects = conversation.val()?Object.values(conversation.val()):{};
    var messagesSent = 0, wordsSent = 0;
    var messagesReceived = 0, wordsReceived = 0;
    // console.log(messageObjects[0].text);
    for(var i=0; i<messageObjects.length; i++){
      if(messageObjects[i].uid == this.myUid){
        messagesSent += 1;
        if(messageObjects[i].text)wordsSent += messageObjects[i].text.split(' ').length;
      } else {
        messagesReceived+=1;
        if(messageObjects[i].text)wordsReceived += messageObjects[i].text.split(' ').length;
      }
    }
    this.addComponent('messagesSent', messagesSent);
    this.addComponent('wordsSent', wordsSent);
    this.addComponent('messagesReceived', messagesReceived);
    this.addComponent('wordsReceived', wordsReceived);

  }.bind(this));
}
ConvStatElementMachine.prototype.addComponent = function(key, value){
  this.obj[key] = value;
  if(this.obj.hasOwnProperty('displayName') &&
     this.obj.hasOwnProperty('photoURL') &&
     this.obj.hasOwnProperty('messagesSent') &&
     this.obj.hasOwnProperty('messagesReceived') &&
     this.obj.hasOwnProperty('wordsSent') &&
     this.obj.hasOwnProperty('wordsReceived') &&
     this.obj.hasOwnProperty('email') ){
       var temp = document.createElement('div');
       temp.innerHTML = convStatTemplate;
       var stat = temp.firstChild;
       stat.querySelector('.title').textContent = this.obj['displayName'];
       stat.querySelector('.profile-pic').src = this.obj['photoURL'];
       stat.querySelector('.email').textContent = this.obj['email'];
       const subject = this.forSelf ? "You" : document.getElementById('display-name').textContent;
       stat.querySelector('.sent').textContent = subject+' sent '+ this.obj['messagesSent'] +
       ' message(s) and '+this.obj['wordsSent']+' word(s).';
       stat.querySelector('.received').textContent = subject+' received '+ this.obj['messagesReceived'] +
       ' message(s) and '+this.obj['wordsReceived']+' word(s).';
       if(this.forSelf) stat.href = 'dashboard.html?targetUID='+this.targetUID;


       document.getElementById('conversation-stat-list').appendChild(stat);
  }
};

const convStatTemplate =
// "<div class='card'>" +
//     "<div class='card-content'>"+
//         "<span class='card-title center-align'>Otheruserum Nameum</span>" +
//         "<img class='profile-pic circle' src=# width='100px' height='100px'></img>" +
//         "<p class='email'>anotheruser@example.com</p>" +
//         "<p class='sent'>Sent: 20 Messages, 131 Words</p>" +
//         "<p class='received'>Received: 17 Messages, 146 Words</p>" +
//     "</div>" +
// "</div>";
'<a class="link" href=# style="color:gray">' +
'<li class="collection-item avatar">' +
      '<img src=# alt="" class="profile-pic circle">' +
      '<span class="title" style="color:black">Username</span>' +
      '<p class="email translate">anotheruser@example.com</p>' +
      '<p class="sent translate">Sent: 20 Messages, 131 Words</p>' +
      '<p class="received translate">Received: 17 Messages, 146 Words</p>' +
'</li>' +
'</a>';

// '<div href=# class="collection-item avatar">' +
//   '<span><img class="pic circle" src=#></span>' +
//   '<span class="name title">Name</span>' +
//   '<span class="new badge">0</span>'+
//
// '</div>';

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

// function httpGetAsync(theUrl, callback)
// {
//     var xmlHttp = new XMLHttpRequest();
//     xmlHttp.onreadystatechange = function() {
//         if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
//             callback(xmlHttp.responseText);
//     }
//     xmlHttp.open("GET", theUrl, true); // true for asynchronous
//     xmlHttp.send(null);
// }

window.onload = function() {
  new StatSummary();
};
