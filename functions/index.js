var functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp(functions.config().firebase);
const gmailEmail = encodeURIComponent(functions.config().gmail.email);
const gmailPassword = encodeURIComponent(functions.config().gmail.password);
const mailTransport = nodemailer.createTransport(
    `smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com`);

const APP_NAME = 'World Without Borders';


exports.hello = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
})

function Command(event, uid, params) {
    this.event = event;
    this.uid = uid;
    this.params = params;
}

Command.prototype.success = function(resp) {
  return this.event.data.ref.child('response').set(resp);
};

Command.prototype.error = function(err) {
  return this.event.data.ref.child('error').set(err);
};

// All command functions defined MUST eventually call either the success or error function.
Command.prototype.sayHi = function() {
  const err = this.params.err;
  if(err) {
    this.error("Error because you told me to.");
  } else {
    this.success("Hi, buddy!");
  }
};

Command.prototype.sendEmail = function() {
  sendAnEmail(this.params.emailAddress, this.params.subject, this.params.text);
  this.success('Email sent successfully to '+this.params.emailAddress);
};

Command.prototype.sendMessage = function() {
  const recipientUID = this.params.recipientUID;
  const displayName = this.params.displayName;
  const text = this.params.text;
  const photoUrl = this.params.photoUrl;
  if(recipientUID && displayName && text && photoUrl) {
    //Add the message to the conversation.
    const convKey = this.uid > recipientUID ? this.uid+recipientUID : recipientUID+this.uid;
    return admin.database().ref('conversations/'+convKey).push({
      name: displayName,
      text: text,
      photoUrl: photoUrl,
      uid: this.uid
    }).then(function(){

      // Also increment recipient user's unreadMessages as appropriate.
      // Since it's not absolutely crucial for this step to work, I won't call sucess when done.
      // Success already is called when the main message object is saved (code above).
      // unread messages won't get incremented if the recipeient user is online.
      // console.log('about to set unreadMessages');
      // admin.database().ref('presence/'+recipientUID).once('value', function(snapshot){
        // if(snapshot.val()) {
        //   // console.log('was going to increment unread messages but user is online');
        // } else {
      const recipientConvContainerRef = admin.database()
        .ref('user-data/'+recipientUID+'/conversations')
        .orderByChild('recipientUID').equalTo(this.uid).limitToFirst(1);
      return recipientConvContainerRef.once('value', function(snapshot){
        // Snapshot.val() should contain 1 child that has an arbitray pushId
        // The value is the recipient's conversation obj
        // There is however a chance the recipient doesn't have the conversation added yet...
        if(snapshot.val()) {
          const pushId = Object.keys(snapshot.val())[0];
          const unreadMessages = snapshot.val()[pushId].unreadMessages;

          return admin.database().ref('presence/'+recipientUID).once('value', function(snapshot){
            if(!snapshot.val()) { // Only increment unread messages if user is offline
              var newUnreadMessages = 0;
              return admin.database().ref(recipientConvContainerRef.path+'/'+pushId+'/unreadMessages')
                .transaction(function(oldUnreadMessages){
                  newUnreadMessages = (oldUnreadMessages || 0) + 1;
                  return newUnreadMessages;
              }.bind(this)).then(function(){
                  console.log("New Unread Messages: "+newUnreadMessages);
                  if(newUnreadMessages % 3 === 0) {
                    return admin.database().ref('user-data/'+recipientUID).once('value', function(snapshot){
                      const recipientEmail = snapshot.val().email;
                      const recipientName = snapshot.val().displayName;
                      return sendAnEmail(recipientEmail,
                        'You have '+newUnreadMessages+' new messages from '+displayName+'.',
                        'Hello '+(recipientName?recipientName:'')+'! You have '+(unreadMessages+1)+
                        ' new messages from '+displayName+'. Don\'t keep your ePenPal waiting. ' +
                        'Log into http://worldwithoutborders.ml/ to send a reply!').then(function(){
                          return this.success("Successfully sent message to uid "+recipientUID);
                      }.bind(this));
                    }.bind(this));
                  }
                }.bind(this));
              }
            }.bind(this));


          } else {
            // Uh Oh! The recipient doesn't have the conversation!
            return admin.database().ref('user-data/'+recipientUID+'/conversations').push({
              recipientUID: this.uid,
              unreadMessages: 1
            }).then(function(){
              // this.success("Successfully added conversation with uid "+recipientUID);
              console.log("Send message! The recipient didn't yet have a conversation, so it was added!");
              return this.success("Successfully sent message to uid "+recipientUID);

            }.bind(this));
          }

      }.bind(this));
        // }
      // }.bind(this));


    }.bind(this)).catch(function(err){
      return this.error("Error occured while trying to push message object: "+err);
    }.bind(this));



  } else {
    return this.error("sendMessage command must have parameters for recipientUID, displayName, text, and photoURL");
  }
};

Command.prototype.addConversation = function() {
  const recipientUID = this.params.recipientUID;
  const recipientEmail = this.params.recipientEmail; // <--Assume undefined
  if(recipientUID) {
    // It's easiest to do this if we just know the recipientUID
    //   1) Add to my own conversation
    return admin.database().ref('user-data/'+this.uid+'/conversations').push({
      recipientUID: recipientUID,
      unreadMessages: 0
    }).then(function(){
      //  2) Add to the recipient's conversations
      return admin.database().ref('user-data/'+recipientUID+'/conversations').push({
        recipientUID: this.uid,
        unreadMessages: 0
      }).then(function(){
        return admin.database().ref('user-data/'+recipientUID).once('value', function(snapshot){
          const notifyAddress = snapshot.val().email;
          // console.log("notifyAddress: "+notifyAddress);
          // console.log("snapshot val: "+stringObjRecursive(snapshot.val()));
          return sendAnEmail(notifyAddress, "You have a new conversation!", "Someone new wants to talk to you! Log into http://worldwithoutborders.ml/ to keep the conversation going!")
            .then(this.success.bind(this, "Successfully added conversation with uid "+this.params.recipientUID));
        }.bind(this));

      }.bind(this));
    }.bind(this));
  } else if(recipientEmail) {
    // A little harder but still doable. TODO Make it work.
    return this.error("Adding by email not supported yet. Sry.");
  } else {
    // Best error.
    return this.error("For addConversation please supply parameter for " +
      "either recipeientEmail or recipientUID");
  }
}
// this.messagesRef.push({
//   name: currentUser.displayName,
//   text: this.messageInput.value,
//   photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
//   uid: currentUser.uid
// }).t

Command.prototype.registerInSchool = function() {
    const userRef = admin.database().ref('/user-data/'+this.uid);

    userRef.once('value', function(data) {
      const displayName = data.val().displayName;
      const email = data.val().email;
      const photoURL = data.val().photoURL;
      const myUid = data.val().uid;
      const myOldSchoolCode = data.val().schoolCode; // <- Null if not yet registered in school
      // console.log(this.params);
      const schoolRef = admin.database().ref('/schools/'+this.params.schoolCode);
      return schoolRef.once('value', function(data) {
        if(data.val()) {
          // If user already exists in school, don't push a new object.
          const allStudents = objValues(data.val().students?data.val().students:[]);
          for(var i=0; i< allStudents.length; i++) {
            const each = allStudents[i];
            if(each.uid === myUid) return this.success("You are already registered for this school!");
          }
          schoolRef.child('students').push({
            'displayName': displayName,
            'email': email,
            'photoURL': photoURL,
            'uid': this.uid
          }).then(function(){
            userRef.update({'/schoolCode': this.params.schoolCode}).then(function(){
              if(myOldSchoolCode) {
                // Clear the old school of the user's account if he/she was in an old school.
                // console.log('old school code: '+myOldSchoolCode);
                const oldSchoolRef = admin.database().ref('/schools/'+myOldSchoolCode);
                oldSchoolRef.child('students').orderByChild('uid')
                 .equalTo(myUid).once('value', function(data){
                  //  console.log('query data: '+data.val());
                   if(data.val()){
                     //Student must be taken out of old school.
                     const pushKey = Object.keys(data.val())[0];
                    //  console.log("push key:"+ data.key);
                     oldSchoolRef.child('students/'+pushKey).set(null).then(function(){
                      //  console.log('student removed from old school');
                       this.success('Successfully registered for school! '+this.params.schoolCode);
                     }.bind(this));
                   } else {
                     //the student wasn't in the old school. weird. done.
                    //  console.log("the student wasn't in the old school. weird. done.");
                     this.success('Successfully registered for school! '+this.params.schoolCode);
                   }
                }.bind(this));
              } else {
                this.success('Successfully registered for school! '+this.params.schoolCode);
              }
            }.bind(this));
          }.bind(this));
        } else {
          return this.error('There is no school with that code.');
        }
      }.bind(this));
    }.bind(this));
};

//For educator accounrs
Command.prototype.addAssociateSchool = function(){
  const code = this.params.schoolCode;
  if(!code)
    return this.error('addAssociateSchool command must have schoolCode parameter');
  const uid = this.uid;
  // Find caller's schoolCode to locate school ref
  admin.database().ref('educator-data/'+uid).once('value', function(snapshot){
    const callerSchoolCode = snapshot.val().schoolCode;
    const callerSchoolRef = admin.database().ref('schools/'+callerSchoolCode);
    return callerSchoolRef.once('value', function(snapshot){
      // In school ref, see if the code is already there first. Call error if so.
      const associatedSchools = snapshot.val().associatedSchools;
      const asCodes = associatedSchools?Object.keys(associatedSchools).map(function(key){
        return associatedSchools[key];
      }):[];
      if(asCodes.indexOf(code)===-1) {
        // The school isn't already added. Now let's check if the school exists.
        const otherSchoolRef = admin.database().ref('schools/'+code);
        otherSchoolRef.once('value', function(snapshot){
          if(snapshot.val()) {
            // YAY it exists
            // Add code to callerSchoolRef.associatedSchools
            // Then add callerSchoolCode to otherSchoolRef.associatedSchools
            callerSchoolRef.child('associatedSchools').push(code)
             .then(function(){
               otherSchoolRef.child('associatedSchools').push(callerSchoolCode)
                .then(function(){
                  return this.success('Successfully added school!');
               }.bind(this));
            }.bind(this));
          } else {
            // No exist :(
            return this.error('No school was found with that code.');
          }
        }.bind(this));

      } else {
        // The school is already added.
        return this.error('This school is already added.');
      }
    }.bind(this));
  }.bind(this));
};



exports.requestFunction = functions.database.ref('/function-requests/{pushId}')
    .onWrite(event => {
      // Only edit data when it is first created.
      if (event.data.previous.exists()) {
        return;
      }
      // Exit when the data is deleted.
      if (!event.data.exists()) {
        return;
      }
      // Grab the current value of what was written to the Realtime Database.
      const req = event.data.val();
      const action = req.action;
      const params = req.params;
      const uid = req.uid;
      console.log("function requested!");
      console.log("action: "+action);
      console.log("params: "+stringObjRecursive(req));
      const cmd = new Command(event, uid, params);
      var func = cmd[action] ? cmd[action].bind(cmd): null;

      if(action && params && uid) {
        if(func) {
          func();
        } else {
          console.error("The requested function ''"+ action + "'' does not exist.");
          cmd.error("The requested function ''"+ action + "'' does not exist.");
        }
      } else {
        console.error("Data for function request must have action and params children.");
        cmd.error("Data for function request must have action and params children.");
      }
});

// exports.deleteFuncReq = functions.database.ref('/function-requests/{pushId}/delete')
//     .onWrite(event => {
//       console.log('delete was modified');
//       // Exit when the data is deleted.
//       if(!event.data.exists()) {
//         return;
//       }
//       console.log('and it was not deleted');
//       if(event.data.val()) {
//         console.log('now its deleted');
//         return event.data.ref.parent.set({});
//       }
// });

// [START onCreateTrigger]
exports.sendWelcomeEmail = functions.auth.user().onCreate(event => {
// [END onCreateTrigger]
  // [START eventAttributes]
  const user = event.data; // The Firebase user.

  const email = user.email; // The email of the user.
  const displayName = user.displayName; // The display name of the user.
  // [END eventAttributes]

  return sendWelcomeEmail(email, displayName);
});
// [END sendWelcomeEmail]

// Sends a welcome email to the given user.
function sendWelcomeEmail(email, displayName) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Welcome to ${APP_NAME}!`;
  mailOptions.text = `Hey ${displayName || ''}! Welcome to ${APP_NAME}. I hope you will enjoy our service.`;
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('New welcome email sent to:', email);
  });
}

function sendAnEmail(emailAddress, subject, text) {
  console.log('send email request for '+emailAddress);
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: emailAddress,
    subject: subject,
    text: text
  };
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('New email sent to:', emailAddress);
  });
}

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
