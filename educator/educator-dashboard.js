
'use strict';

function EducatorDashboard() {
  this.database = firebase.database();
  this.auth = firebase.auth();
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));

  document.getElementById('sign-out')
    .addEventListener('click', this.signOut.bind(this));
  document.getElementById('sign-out-mobile')
    .addEventListener('click', this.signOut.bind(this));
}

EducatorDashboard.prototype.onAuthStateChanged = function(user) {
  if(user) {

  } else {
    // Signed out
    window.location.href = './educator-login.html';
  }
};

EducatorDashboard.prototype.signOut = function() {
  this.auth.signOut();
};

(function($) {
    $(function() {
        $('.button-collapse').sideNav();
        $('select').material_select();
        $('.materialboxed').materialbox();
        // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
        $('.modal').modal();
    }); // end of document ready
})(jQuery); // end of jQuery name space

new EducatorDashboard();
