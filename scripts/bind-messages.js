
'use strict';

// Initializes a list of messages and listens for more.
// REQUIRES that a few html elements exist in the document with the following IDs
function LoadMessages(targetUID) {

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

  if(this.targetUID===null) {
    console.log('target id = null');
    document.getElementById("nothing-to-display").removeAttribute('hidden');
    this.messageList.setAttribute('hidden', true);
    this.messageForm.setAttribute('hidden', true);
    this.messageInput.setAttribute('hidden', true);
    this.submitButton.setAttribute('hidden', true);
    return;
  }

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);

  // Events for image upload.
  // this.submitImageButton.addEventListener('click', function() {
  //   this.mediaCapture.click();
  // }.bind(this));
  // this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));


  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));

  this.initFirebase();

}

LoadMessages.prototype.initFirebase = function() {
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

LoadMessages.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    this.loadMessages();
  }
};

// Loads chat messages history and listens for upcoming ones.
LoadMessages.prototype.loadMessages = function() {
  // Load and listens for new messages.
  // The conversation reference is /conversations/{both UIDs stuck together}
  // The order that they're stuck together is based on which one is greater in ASCII land.
  var uid1 = this.auth.currentUser.uid;
  var uid2 = getParameterByName('targetUID');
  var uids = uid1 > uid2 ? uid1+uid2 : uid2+uid1;
  this.messagesRef = this.database.ref('conversations/'+uids);
  this.messagesRef.off();


  // Loads the last 12 messages and listen for new ones.
  var setMessage = function(data) {
    var val = data.val();
    this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl, val.uid);
  }.bind(this);
  this.messagesRef.limitToLast(12).on('child_added', setMessage);
  this.messagesRef.limitToLast(12).on('child_changed', setMessage);
};

// Saves a new message on the Firebase DB.
LoadMessages.prototype.saveMessage = function(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (this.messageInput.value && this.checkSignedInWithMessage()) {

    // Push new message to Firebase.
    var currentUser = this.auth.currentUser;
    // Add a new message entry to the Firebase Database.
    this.messagesRef.push({
      name: currentUser.displayName,
      text: this.messageInput.value,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
      uid: currentUser.uid
    }).then(function() {
      // Clear message text field and SEND button state.
      LoadMessages.resetMaterialTextfield(this.messageInput);
      this.toggleButton();
    }.bind(this)).catch(function(error) {
      console.error('Error writing new message to Firebase Database', error);
    });

  }
};

// Sets the URL of the given img element with the URL of the image stored in Firebase Storage.
LoadMessages.prototype.setImageUrl = function(imageUri, imgElement) {
  // If the image is a Firebase Storage URI we fetch the URL.
  if (imageUri.startsWith('gs://')) {
    imgElement.src = LoadMessages.LOADING_IMAGE_URL; // Display a loading image first.
    this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
      imgElement.src = metadata.downloadURLs[0];
    });
  } else {
    imgElement.src = imageUri;
  }
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
LoadMessages.prototype.saveImageMessage = function(event) {
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  this.imageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (this.checkSignedInWithMessage()) {

    // Upload image to Firebase storage and add message.
    // We add a message with a loading icon that will get updated with the shared image.
    var currentUser = this.auth.currentUser;
    this.messagesRef.push({
      name: currentUser.displayName,
      imageUrl: LoadMessages.LOADING_IMAGE_URL,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
    }).then(function(data) {

      // Upload the image to Firebase Storage.
      this.storage.ref(currentUser.uid + '/' + Date.now() + '/' + file.name)
          .put(file, {contentType: file.type})
          .then(function(snapshot) {
            // Get the file's Storage URI and update the chat message placeholder.
            var filePath = snapshot.metadata.fullPath;
            data.update({imageUrl: this.storage.ref(filePath).toString()});
          }.bind(this)).catch(function(error) {
        console.error('There was an error uploading a file to Firebase Storage:', error);
      });
    }.bind(this));

  }
};


// Returns true if user is signed-in. Otherwise false and displays a message.
LoadMessages.prototype.checkSignedInWithMessage = function() {
  // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
  }
  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Resets the given MaterialTextField.
LoadMessages.resetMaterialTextfield = function(element) {
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
LoadMessages.prototype.displayMessage = function(key, name, text, picUrl, imageUri, uid) {
  var div = document.getElementById(key);
  var currentUser = this.auth.currentUser;

  // If an element for that message does not exists yet we create it.
  if (!div) {
    var temp = document.createElement('div');
    temp.innerHTML = LoadMessages.MESSAGE_TEMPLATE;
    div = temp.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
    if(uid == currentUser.uid) { // Switch positioning of message if user sent message
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
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      this.chat.scrollTop = this.chat.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }

  var profilePic = div.querySelector('.pic');
  if(uid == currentUser.uid) {
      // console.log("message sent by current user");
      messageElement.style.background = "#009688";
      messageElement.style.color = "white";
      profilePic.style.marginLeft = "7.5px";

  }

  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.chat.scrollTop = this.chat.scrollHeight;
  this.messageInput.focus();
  // $("#chat").animate({ scrollTop: $('#chat').prop("scrollHeight")}, 1000);

};

// Enables or disables the submit button depending on the values of the input
// fields.
LoadMessages.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};


var getURLParameterByName = function(name, url) {
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
