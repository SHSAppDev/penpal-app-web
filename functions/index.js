var functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// // Start writing Firebase Functions
// // https://firebase.google.com/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase! Ryan was here.");
})

function registerInSchool(event, params) {
  console.log("Register in school called! params: "+params.toString());
  console.log("obj "+JSON.stringify(event));

}

exports.requestFunction = functions.database.ref('/function-requests/{pushId}')
    .onWrite(event => {
      // Only edit data when it is first created.
      // if (event.data.previous.exists()) {
      //   return;
      // }
      // Exit when the data is deleted.
      if (!event.data.exists()) {
        return;
      }
      // Grab the current value of what was written to the Realtime Database.
      const req = event.data.val();
      const action = req.action;
      const params = req.params;
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
        if(func) func(event, params);
      } else {
        console.error("Data for function request must have action and params children.");
      }

      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      // return event.data.ref.parent.child('uppercase').set(uppercase);
});
