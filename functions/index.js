var functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// // Start writing Firebase Functions
// // https://firebase.google.com/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase! Ryan was here.");
})

function registerInSchool(event, uid, params) {
  const userRef = admin.database().ref('/user-data/'+uid);

  userRef.once('value', function(data){
    const displayName = data.val().displayName;
    const email = data.val().email;
    const photoURL = data.val().photoURL;
    const schoolRef = admin.database().ref('/schools/'+params.schoolCode);
    schoolRef.child('students').push({
      'displayName': displayName,
      'email': email,
      'photoURL': photoURL,
      'uid': uid
    });
    userRef.update({'/schoolCode': params.schoolCode});
  });


}

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
          default:
            console.error("The requested function ''"+ action + "'' does not exist.");
        }
        if(func) func(event, uid, params);
      } else {
        console.error("Data for function request must have action and params children.");
      }
});

exports.deleteFuncReq = functions.database.ref('/function-requests/{pushId}/delete')
    .onWrite(event => {
      // Exit when the data is deleted.
      if(!event.data.exists()) {
        return;
      }
      if(event.data.val() === true) {
        return event.data.ref.parent.set({});
      }
});
