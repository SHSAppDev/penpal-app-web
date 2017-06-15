var functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp(functions.config().firebase);
const gmailEmail = encodeURIComponent(functions.config().gmail.email);
const gmailPassword = encodeURIComponent(functions.config().gmail.password);
const mailTransport = nodemailer.createTransport(
    `smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com`);

const APP_NAME = 'World Without Borders ePenPal service';


exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase! Ryan was here.");
})

function Command(event, uid, params) {
    this.event = event;
    this.uid = uid;
    this.params = params;
}

Command.prototype.success = function(resp) {

};

function sayHi(event, uid, params) {
  const err = params.err;
  if(err){
    return event.data.ref.child('error').set('ERROR: Because you told me to....');
  } else {
    return event.data.ref.child('response').set('Hello, World!');
  }
}

function emailSendCommand(event, uid, params) {
  sendAnEmail(params.emailAddress, params.subject, params.text);
  return event.data.ref.child('response').set('Email sent successfully to '+params.emailAddress);
}

function registerInSchool(event, uid, params) {
  const userRef = admin.database().ref('/user-data/'+uid);

  userRef.once('value', function(data) {
    const displayName = data.val().displayName;
    const email = data.val().email;
    const photoURL = data.val().photoURL;
    const schoolRef = admin.database().ref('/schools/'+params.schoolCode);
    return schoolRef.once('value', function(data){
      if(data.val()) {
        schoolRef.child('students').push({
          'displayName': displayName,
          'email': email,
          'photoURL': photoURL,
          'uid': uid
        }).then(function(){
          userRef.update({'/schoolCode': params.schoolCode}).then(function(){
            return event.data.ref.child('response').set('Successfully registered for school! '+params.schoolCode);
          });
        });
      } else {
        return event.data.ref.child('error').set('The school does not exist.');
      }
    });
  });

}

// function registerInSchool(event, uid, params) {
//   const userRef = admin.database().ref('/user-data/'+uid);
//
//   userRef.once('value', function(data){
//     const displayName = data.val().displayName;
//     const email = data.val().email;
//     const photoURL = data.val().photoURL;
//     const schoolRef = admin.database().ref('/schools/'+params.schoolCode);
//     return schoolRef.once();
// }

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
      console.log("params: "+params);
      if(action && params) {
        var func = null;
        switch(action) {
          case 'registerInSchool':
            func = registerInSchool;
            break;
          case 'sayHi':
            func = sayHi;
            break;
          case 'emailSendCommand':
            func = emailSendCommand;
            break;
          default:
            console.error("The requested function ''"+ action + "'' does not exist.");
        }
        if(func) return func(event, uid, params);
      } else {
        console.error("Data for function request must have action and params children.");
      }
});

exports.deleteFuncReq = functions.database.ref('/function-requests/{pushId}/delete')
    .onWrite(event => {
      console.log('delete was modified');
      // Exit when the data is deleted.
      if(!event.data.exists()) {
        return;
      }
      console.log('and it was not deleted');
      if(event.data.val()) {
        console.log('now its deleted');
        return event.data.ref.parent.set({});
      }
});

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
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: emailAddress,
    subject: subject,
    text: text
  };
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('New email sent to:', email);
  });
}
