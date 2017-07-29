'use strict';

// Initializes a list of messages and listens for more. Handles all things in the chat UI.
// REQUIRES that a few html elements exist in the document with the following IDs
function LoadMessages(targetUID) {
  document.getElementById('chat-preloader').style.display = "block";
  // These are the IDs:
  this.chat = document.getElementById('chat');
  this.messageList = document.getElementById('messages');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');
  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');

  this.mediaCapture = document.getElementById('mediaCapture');
  this.targetUID = targetUID;

  this.chatTitle = document.getElementById('chat-title');

  if(this.targetUID===null) {
    document.getElementById("nothing-to-display").removeAttribute('hidden');
    document.getElementById("chat-container").style.display = 'none';
    document.getElementById("tools-container").style.display = 'none';
    return;
  }

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);

  // Events for image upload.
  this.submitImageButton.addEventListener('click', function () {
    this.mediaCapture.click();
  }.bind(this));
  this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));

  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));

  if(Notification) {
    Notification.requestPermission();
    setTimeout(function(){
      this.displayMessageNotifications = true;
      // this is a gross hack. but it works for now.
      // By having this variable be set to true after a few seconds,
      // I can avoid showing notifications for the messages getting
      // loaded initially.
    }.bind(this), 5000);
  } else {
    console.log("Notifications are not supported.");
  }


  this.initFirebase();
}

LoadMessages.prototype.initFirebase = function () {
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

LoadMessages.prototype.onAuthStateChanged = function (user) {
  if (user) { // User is signed in!
    this.loadMessages();
    this.userInfo = new UserInfo();
    this.userInfo.startTrackingTime();
    this.setChatTitle();
    this.command = new Command();
    if(this.targetUID) {

      // We've entered the conversation, so no more messages should be unread
      var myConversationsRef = this.database.ref('user-data/' + firebase.auth().currentUser.uid + '/conversations');
      myConversationsRef.orderByChild("recipientUID").equalTo(this.targetUID).limitToFirst(1).once('value', function (data) {
        var convKey = Object.keys(data.val())[0]
        var updates = {};
        updates["/" + convKey + "/unreadMessages"] = 0
        myConversationsRef.update(updates);
      });
    }
  }
};

// Loads chat messages history and listens for upcoming ones.
LoadMessages.prototype.loadMessages = function () {
  // Load and listens for new messages.
  // The conversation reference is /conversations/{both UIDs stuck together}
  // The order that they're stuck together is based on which one is greater in ASCII land.
  var uid1 = this.auth.currentUser.uid;
  var uid2 = getParameterByName('targetUID');
  var uids = uid1 > uid2 ? uid1 + uid2 : uid2 + uid1;
  this.messagesRef = this.database.ref('conversations/' + uids);
  this.messagesRef.off();

  // Loads the last messages and listen for new ones.
  var setMessage = function (data) {
    var val = data.val();
    if(val.uid !== firebase.auth().currentUser.uid && this.displayMessageNotifications) {
      this.makeNotification(val);
    }
    this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl, val.uid);
<<<<<<< HEAD

    // Display Notification right here... 

    // get permission to run notifications 

        Notification.requestPermission().then(function(result) {
            console.log(result);
        });

        Notification.requestPermission();

        "permissions": {
            "desktop-notification": { 
                "description": "Needed for creating system notifications."
            }
        },
        "messages": {{"notification": "path/to/your/index.html"}]

        function notifyMe() {
        // Let's check if the browser supports notifications 
            if (!("Notification" in window)) 
                alert("This browser does not support system notifications");
        }

        // Let's check whether notification permissions have already been granted 
        else if (Notification.permission === "granted") {
            If it's okay let's create a notification 
            var notification = new Notification("Hi there!");
        }

        // Otherwise, we need to ask the user for permission 
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
                // If the user accepts. let's create a notification 
                if (permission === "granted") {
                    var notification = new Notification("Hi there!");
                }
            });
        }
        // Finally, if the user has denied notifications and you 
        // want to be respectful there is no need to bother them any more.
    }

    function spawnNotification(theBody,theIcon, theTitle) {
        var options ={
            body: theBody, 
            icon: theIcon
        }
        var n = new Notification(theTitle,options);
        setTimeout(n.close,bind(n), 5000);
    }

    function randomNotification() {
        var randomQuote = quoteChooser();
        var options = {
            body: randomQuote, 
            icon: 'img/sad_head.png'.
        }
    
    var n = new Notification('World Withou Borders says', options);
    setTimeout(n.close.bind(n), 5000);
}

    // Display a notification right here....

  }.bind(this);
  this.messagesRef.limitToLast(30).on('child_added', setMessage);
  this.messagesRef.limitToLast(30).on('child_changed', setMessage);
  document.getElementById('chat-preloader').style.display = "none";

};

LoadMessages.prototype.setChatTitle = function() {
  if(this.targetUID) {
    firebase.database().ref('user-data/'+this.targetUID).once('value', function(data){
      if(!data.val()) {
        // window.alert("Uh Oh, it looks like this user doesn't exist anymore. That's strange...");
        Materialize.toast("Uh Oh, it looks like this user doesn't exist anymore. That's strange...", 3000);

        return;
      }
      const displayName = data.val().displayName;
      this.chatTitle.querySelector('.display-name').textContent = displayName;

      const timezone = data.val().timezone;
      if(timezone) {
        console.log('set chat title: '+data.val().timezone);

        const setLocalTime = function(timezone){
          const formattedLocalTime = this.userInfo.convertTime(timezone);
          this.chatTitle.querySelector('.local-time').textContent = "(Local Time: "+formattedLocalTime+")";
        }.bind(this);
        setLocalTime(timezone);
        setInterval(setLocalTime.bind(this, timezone), 30 * 1000);
      }
      this.chatTitle.removeAttribute('hidden');

    }.bind(this));
  }
}

// Saves a new message on the Firebase DB.
LoadMessages.prototype.saveMessage = function (e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  // if (this.messageInput.value && this.auth.currentUser) {
  //
  //   // Push new message to Firebase.
  //   var currentUser = this.auth.currentUser;
  //   // Add a new message entry to the Firebase Database.
  //   this.messagesRef.push({
  //     name: currentUser.displayName,
  //     text: this.messageInput.value,
  //     photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
  //     uid: currentUser.uid
  //   }).then(function () {
  //     // Clear message text field and SEND button state.
  //     LoadMessages.resetMaterialTextfield(this.messageInput);
  //     this.toggleButton();
  //     this.incrementRecipientUnreadMessages();
  //   }.bind(this)).catch(function (error) {
  //     console.error('Error writing new message to Firebase Database', error);
  //   });

  // Check that the user entered a message and is signed in.
  if (this.messageInput.value && this.auth.currentUser) {

    // Push new message to Firebase.
    var currentUser = this.auth.currentUser;
    // Add a new message entry to the Firebase Database.
    this.command.requestFunction('sendMessage', {
      displayName: currentUser.displayName,
      text: this.messageInput.value,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
      recipientUID: this.targetUID
    }, {
      'success': function(resp){

      }.bind(this),
      'error': function(err){
        console.error('Error writing new message to Firebase Database', err);
        //TODO display a sending error in ui
      }.bind(this)
    });
    LoadMessages.resetMaterialTextfield(this.messageInput);
    this.toggleButton();

    // this.messagesRef.push({
    //   name: currentUser.displayName,
    //   text: this.messageInput.value,
    //   photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
    //   uid: currentUser.uid
    // }).then(function () {
    //   // Clear message text field and SEND button state.
    //   LoadMessages.resetMaterialTextfield(this.messageInput);
    //   this.toggleButton();
    //   // this.incrementRecipientUnreadMessages();
    // }.bind(this)).catch(function (error) {
    //   console.error('Error writing new message to Firebase Database', error);
    // });

  }
};

// Sets the URL of the given img element with the URL of the image stored in Firebase Storage.
LoadMessages.prototype.setImageUrl = function (imageUri, imgElement) {
  // If the image is a Firebase Storage URI we fetch the URL.
  if (imageUri.startsWith('gs://')) {
    imgElement.src = LoadMessages.LOADING_IMAGE_URL; // Display a loading image first.
    this.storage.refFromURL(imageUri).getMetadata().then(function (metadata) {
      imgElement.src = metadata.downloadURLs[0];
    });
  } else {
    imgElement.src = imageUri;
  }
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
LoadMessages.prototype.saveImageMessage = function (event) {
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  // console.log(this);
  // console.log(this.imageForm);
  this.imageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    // var data = {
    //   message: 'You can only share images',
    //   timeout: 2000
    // };
    // this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    // TODO insert some notification that says "Must be an image"
    return;
  }
  // Check if the user is signed-in
  if (this.auth.currentUser) {

    // Upload image to Firebase storage and add message.
    // We add a message with a loading icon that will get updated with the shared image.
    var currentUser = this.auth.currentUser;
    this.messagesRef.push({
      name: currentUser.displayName,
      imageUrl: LoadMessages.LOADING_IMAGE_URL,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
      uid: currentUser.uid
    }).then(function (data) {

      // Upload the image to Firebase Storage.
      this.storage.ref(currentUser.uid + '/' + Date.now() + '/' + file.name)
        .put(file, {
          contentType: file.type
        })
        .then(function (snapshot) {
          // Get the file's Storage URI and update the chat message placeholder.
          var filePath = snapshot.metadata.fullPath;
          data.update({
            imageUrl: this.storage.ref(filePath).toString()
          });
        }.bind(this)).catch(function (error) {
          console.error('There was an error uploading a file to Firebase Storage:', error);
        });
    }.bind(this));

  }
};

LoadMessages.prototype.makeNotification = function(val) {
  // Attempts to create a notification. Will show if permission is granted.
  // Will do nothing if permission is denied.
  // Will request if permission is default.
  if(!Notification) return;
  switch(Notification.permission) {
    case "granted":
      this.displayNotification(val);
      break;
    case "default":
      Notification.requestPermission(function(permission){
        if(permission === 'granted') this.displayNotification(val);
      }.bind(this));
      break;
    default:
      console.log('attempted showing notification but permission was denied.');
  }
};

LoadMessages.prototype.displayNotification = function(val) {
  // this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl, val.uid);
  // console.log(val);
  const title = val.name;
  const options = {
    body: val.text,
    icon: val.photoUrl
  }
  // console.log(options);
  var n = new Notification(title, options);
  setTimeout(n.close.bind(n), 10000);
}

//
// // Returns true if user is signed-in. Otherwise false and displays a message.
// LoadMessages.prototype.checkSignedInWithMessage = function() {
//   // Return true if the user is signed in Firebase
//   if (this.auth.currentUser) {
//     return true;
//   }
//   // Display a message to the user using a Toast.
//   var data = {
//     message: 'You must sign-in first',
//     timeout: 2000
//   };
//   this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
//   return false;
// };

// Resets the given MaterialTextField.
LoadMessages.resetMaterialTextfield = function (element) {
  element.value = '';
  // element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// Template for messages.
LoadMessages.MESSAGE_TEMPLATE =
  '<div class="message-container">' +
  '<div class="pic"></div>' +
  '<div class="message"></div>' +
  '<div class="name"></div>' +

  '</div>';

// A loading image URL.
LoadMessages.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Displays a Message in the UI.
LoadMessages.prototype.displayMessage = function (key, name, text, picUrl, imageUri, uid) {
  var div = document.getElementById(key);
  var currentUser = this.auth.currentUser;

  // If an element for that message does not exists yet we create it.
  if (!div) {
    var temp = document.createElement('div');
    temp.innerHTML = LoadMessages.MESSAGE_TEMPLATE;
    div = temp.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
    if (uid == currentUser.uid) { // Switch positioning of message if user sent message
      // console.log("switching position "+uid);
      div.style.flexDirection = "row-reverse";
      div.style.justifyContent = "flex-start"
    }

  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.name').textContent = name;
  div.querySelector('.name').style.marginRight = "7.5px";
  var messageElement = div.querySelector('.message');
  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUri) { // If the message is an image.
    var temp = document.createElement('div');
    temp.innerHTML = '<img src=# class="materialboxed" width="300"></img>';
    var image = temp.firstChild;
    image.addEventListener('load', function () {
      this.chat.scrollTop = this.chat.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
    $('.materialboxed').materialbox();
  }

  var profilePic = div.querySelector('.pic');
  if (uid == currentUser.uid) {
    // console.log("message sent by current user");
    messageElement.style.background = "#009688";
    messageElement.style.color = "white";
    profilePic.style.marginLeft = "7.5px";

  } else {
    messageElement.style.color = "#212121";
  }

  // Show the card fading-in.
  setTimeout(function () {
    div.classList.add('visible')
  }, 1);
  this.chat.scrollTop = this.chat.scrollHeight;
  this.messageInput.focus();
  // $("#chat").animate({ scrollTop: $('#chat').prop("scrollHeight")}, 1000);

};

// Enables or disables the submit button depending on the values of the input
// fields.
LoadMessages.prototype.toggleButton = function () {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// LoadMessages.prototype.incrementRecipientUnreadMessages = function () {
//   //WARNING this might seem sorta confusing
//   var recipientConversationContainerRef = this.database.ref('user-data/' + this.targetUID)
//     .child('conversations').orderByChild('recipientUID')
//     .equalTo(this.auth.currentUser.uid).limitToFirst(1);
//   recipientConversationContainerRef.once('value', function (data) {
//     // console.log(data.val());
//     // data.val() should be an object that has just one child which os the
//     // random key for the conversation. Inside that is the unreadMessages
//     // property which we can set.
//     var theWeirdKey = Object.keys(data.val())[0];
//     var cVal = data.val()[theWeirdKey].unreadMessages; // The current unread messages value
//     var newVal = 0;
//     if (cVal === null || cVal === undefined || cVal === 0) {
//       newVal = 1;
//     } else {
//       newVal = cVal + 1;
//     }
//     var convRef = this.database.ref('user-data/' + this.targetUID)
//       .child('conversations').child(theWeirdKey);
//     convRef.update({
//       '/unreadMessages': newVal
//     });
//
//   }.bind(this));
// }


var getURLParameterByName = function (name, url) {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

var targetUID = getURLParameterByName('targetUID');

var x = new LoadMessages(targetUID);
