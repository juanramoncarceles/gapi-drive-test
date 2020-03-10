// Firebase App (the core Firebase SDK) is always required and must be listed first.
import * as firebase from "firebase/app";
// The Firebase SDK for Analytics.
import "firebase/analytics";
// The Firebase products that are used.
import "firebase/firestore";
import "firebase/messaging";

import { Application } from './app';
import Generics from './generics';
import API from './api';


/********************* FIREBASE INITIALIZATION *********************/

// The firebase configuration for the app.
const firebaseConfig = {
  apiKey: "AIzaSyB9KC9Q3NzMt7b6TspNcKxqWqnzzPLvdFg",
  authDomain: "testgdproject-1570036439931.firebaseapp.com",
  databaseURL: "https://testgdproject-1570036439931.firebaseio.com",
  projectId: "testgdproject-1570036439931",
  storageBucket: "testgdproject-1570036439931.appspot.com",
  messagingSenderId: "199844453643",
  appId: "1:199844453643:web:4aa7ba97d1ae2e428b560e"
};

// Initialization of Firebase.
firebase.initializeApp(firebaseConfig);


/******************* SERVICE WORKER REGISTRATION *******************/

// TODO: Do this only if the user autenticates?
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('Service worker registered.', reg);
        // Use a custom service worker for firebase messaging.
        // Otherwise 'firebase-messaging-sw.js' should be used.
        messaging.useServiceWorker(reg);
      })
      .catch(err => {
        console.error('Service Worker Error', err);
      });
  });
}


/******************** FIREBASE CLOUD MESSAGING ******************
 * Manages the creation of device tokens to receive push notifications.
*/

// Retrieve the Firebase Messaging object.
const messaging = firebase.messaging();

// Handle incoming messages when the app is in the foreground / focus.
messaging.onMessage(payload => {
  console.log('Message received. ', payload);
  const data = payload.data;
  App.notificationsManager.createNotificaction(data);
});

// Callback fired if Instance ID token is updated.
messaging.onTokenRefresh(() => {
  messaging.getToken().then(refreshedToken => {
    console.log('FCM token refreshed:', refreshedToken);
    // Send the new Device Token to the datastore.
    firebase.firestore().collection('fcmTokens').doc(refreshedToken)
      .set({ email: App.userInfo.emailAddress });
  }).catch(err => {
    console.log('Unable to retrieve refreshed token ', err);
  });
});


/**
 * Auxiliary function to view the device token for FCM.
 */
window.getMessagingToken = function () {
  firebase.messaging().getToken()
    .then(token => {
      console.log(token);
    })
    .catch(err => {
      console.error(err);
    })
}


/**
 * Saves the FCM token to the datastore and session storage.
 * If notification permissions have not been granted it asks for them.
 */
window.saveMessagingDeviceToken = function () {
  if (!sessionStorage.getItem('deviceToken')) {
    firebase.messaging().getToken().then(token => {
      if (token) {
        console.log('FCM token generated:', token);
        // Saving the FCM token in Firestore.
        firebase.firestore().collection('fcmTokens').doc(token)
          .set({ email: App.userInfo.emailAddress });
        // Saving token in Session Storage.
        sessionStorage.setItem('deviceToken', token);
      } else {
        // Need to request permissions to show notifications.
        requestNotificationsPermissions();
      }
    }).catch(err => {
      console.error('Unable to get FCM token.', err);
    });
  }
}


/**
 * Requests permission to show notifications.
 */
function requestNotificationsPermissions() {
  console.log('Requesting notifications permission...');
  firebase.messaging().requestPermission().then(() => {
    console.log('Notification permission granted.');
    window.saveMessagingDeviceToken();
  }).catch(err => {
    console.error('Unable to get permission to notify:', err);
  });
}

// Equivalent to the previous but without Firebase.
// function requestPermission() {
//   console.log('Requesting permission...');
//   Notification.requestPermission().then(permission => {
//     if (permission === 'granted') {
//       console.log('Notification permission granted.');
//       // TODO: Retrieve an Instance ID token for use with FCM.
//       // If an app has been granted notification permission it can update its UI reflecting this.
//       // resetUI();
//     } else {
//       console.log('Unable to get permission to notify.');
//     }
//   });
// }


/****************** THE ONLY INSTANCE OF THE APP *******************/

const App = new Application();


/************************* GLOBAL METHODS **************************/

window.getCurrentUser = function () {
  return App.userInfo;
}


/************************ BROADCAST CHANNEL *************************
 * To comunicate with the Service Worker and viceversa.
*/

if (window.BroadcastChannel) {
  const broadCastChannel = new BroadcastChannel('app-channel');

  broadCastChannel.onmessage = e => {
    if (e.data.action === 'newNotification') {
      console.log('Add notification to the list.');
      App.notificationsManager.createNotificaction(e.data.content);
    }
  };
} else {
  console.warn('This browser does not support BroadcastChannel.');
}


/******************* VIEW SAMPLE PROJECT OPTION ********************/

const sampleProjectBtn = document.getElementById('sampleProjectBtn');

sampleProjectBtn.onclick = () => {
  document.getElementById('projectsListBtn').onclick = null;
  App.saveBtn.style.visibility = 'hidden';
  App.projectsListBtn.classList.add('locked');
  // TODO: Change the Sign Out button for the Log In button on the side menu.
  App.start('1D4ESY97zKvJoZ1BWeLWYq8GxhQNWsXpg');
}


/************************** AUTHENTICATION *************************/


// Client ID and API key from the Developer Console
const CLIENT_ID = '199844453643-0s921ir25l6rrventemkvr5te5aattej.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDgot_h8p7RzZunGoSDVlKxrpUNN97rPeg';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/drive";

const authorizeButton = document.getElementById('authorizeBtn');
const signoutButton = document.getElementById('signoutBtn');


/**
 *  On load, called to load the auth2 library and API client library.
 */
(function () {
  const script = document.createElement('script');
  script.type = "text/javascript";
  script.defer = true;
  script.onload = () => handleClientLoad();
  script.src = 'https://apis.google.com/js/api.js';
  document.querySelector('body').appendChild(script);
})();


function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}


/**
 *  Initializes the API client library and sets up sign-in state listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function (error) {
    console.log(JSON.stringify(error, null, 2));
  });
}


/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    console.log('Authorized.');
    // Get the URL params.
    const projectId = Generics.getUrlParams(window.location.href).id;
    // Hide the login dialog in case it was visible.
    if (App.modalDialogContent.firstElementChild) {
      App.closeModalDialog();
    }
    // Manage the logged user personal info.
    App.setUserInfo();
    // If a project id is provided to start() method the app will start from the project view.
    App.start(projectId);
  } else {
    console.log('Not authorized');
    showLoginDialog();
  }
}


/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}


/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}


/************************** LOGIN DIALOG ***************************/


const authorizeDialog = document.getElementById('authorizeDialog');

/**
 * Shows the login dialog and hides and clears anything else.
 */
function showLoginDialog() {
  App.showModalDialog(authorizeDialog, 'opaque', false);
  // Hide anything else.
  document.querySelector('header').style.display = 'none';
  document.querySelector('main').style.display = 'none';
  App.projectsListContainer.style.display = 'none';
  // TODO: Delete the contents of the global objects if any.
  // appData.clear();
  // currentProject.clear();
  // lastUploadedProject.clear();
  Generics.emptyNode(App.projectsList);
  history.replaceState({ page: 'Sign in dialog' }, 'Sign in dialog', location.href.replace(location.search, ''));
}


/********************** DRAWINGS BUTTONS LIST **********************/
/*
 * A single event listener in the container of the drawings buttons manages the clicked drawing.
 */

let currentDrawingBtn;

App.drawingsBtns.querySelector('.dropdown-content').addEventListener('click', async function (e) {
  if (currentDrawingBtn) {
    currentDrawingBtn.classList.remove('active');
  }
  currentDrawingBtn = e.target;
  const drawingId = currentDrawingBtn.dataset.id;
  // Set the name of the drawing on the dropdown button.
  // TODO: Do this only if it was successful.
  App.drawingsBtns.children[0].innerText = currentDrawingBtn.innerText;
  currentDrawingBtn.classList.add('active');

  // Get the corresponding drawing object.
  const requestedDrawing = App.workspace.drawings.find(d => d.id === drawingId);

  // Load the drawings styles if it is the first time.
  // TODO: If this is required always the first time maybe do it in the Workspace constructor.
  // TODO: If this finally extracted then the function wont need to be async anymore.
  if (App.workspace.drawingsStylesTag === undefined) {
    if (App.workspace.drawingsStylesId !== undefined) {
      let stylesRes;
      try {
        stylesRes = await API.getFileContent(App.workspace.drawingsStylesId);
      } catch {
        console.error("Error while trying to fetch the drawings styles.");
      }
      if (stylesRes) {
        const styleTag = document.createElement('style');
        styleTag.innerText = stylesRes.body;
        document.head.appendChild(styleTag);
        App.workspace.drawingsStylesTag = styleTag;
      }
    } else {
      console.warn('This project doesn\'t have a css styles file for the drawings.');
    }
  }

  // Check if the requested drawing has already the content.
  if (requestedDrawing.content !== undefined) {
    App.workspace.setDrawing(requestedDrawing);
  } else {
    App.showViewportDialog('loader', 'Loading drawing');
    API.getFileContent(drawingId).then(res => {
      requestedDrawing.setContent(res.body);
      App.workspace.setDrawing(requestedDrawing);
      App.hideViewportMessage();
      console.log('Drawing fetched.');
    }, err => {
      console.log(err);
    });
  }
});


/********************* DROPDOWNS FUNCTIONALITY *********************/

const dropdowns = document.getElementsByClassName('dropdown-container');

for (let i = 0; i < dropdowns.length; i++) {
  dropdowns[i].children[0].addEventListener('click', () => {
    dropdowns[i].classList.toggle('open');
  });
  dropdowns[i].addEventListener('mouseleave', e => {
    e.currentTarget.classList.remove('open');
  });
}


/************************ SIDE NAVE MENU ***************************/

const sideNavToggle = document.getElementById('sideNavToggle');

sideNavToggle.addEventListener('click', () => {
  document.getElementById('sideNavContainer').classList.toggle('active');
  sideNavToggle.classList.toggle('active');
});


/************************* CONTEXT MENU ****************************/

const contextMenu = document.getElementById('contextMenu');
let menuVisible = false;

function toggleMenu(command) {
  contextMenu.style.display = command === "show" ? "block" : "none";
  menuVisible = !menuVisible;
}

function setPosition({ top, left }) {
  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
  toggleMenu("show");
}

window.addEventListener("click", () => {
  if (menuVisible) toggleMenu("hide");
});

window.addEventListener("contextmenu", e => {
  e.preventDefault();
  // Context menu for a project item.
  if (e.target.closest('[data-proj-id]')) {
    // Clean previous content of the context menu.
    contextMenu.querySelector('ul').childNodes.forEach(btn => btn.onclick = null);
    Generics.emptyNode(contextMenu.querySelector('ul'));
    // Get the project item.
    const projectItem = e.target.closest('[data-proj-id]');
    // Get the index of the project in the projectsData.
    const projIndex = App.projectsData.findIndex(proj => proj.id === projectItem.dataset.projId);
    // Create the DELETE button.
    const deleteBtn = document.createElement('li');
    deleteBtn.innerText = 'Delete';
    deleteBtn.onclick = () => {
      App.showViewportDialog('action', `Are you sure you want to delete the ${projectItem.dataset.name} project?`, [
        {
          name: 'Delete',
          function: () => {
            App.showViewportDialog('loader', `Deleting ${projectItem.dataset.name} project.`);
            API.deleteFile(projectItem.dataset.projId).then(res => {
              projectItem.remove();
              App.projectsData.splice(projIndex, 1);
              // TODO check also if it is in the value of currentProject or lastUploadedProject and delete it as well
              App.hideViewportMessage();
              App.showMessage('success', 'Project deleted successfully');
            });
          }
        },
        {
          name: 'Cancel',
          function: () => {
            App.hideViewportMessage();
          }
        }
      ]);
    };
    contextMenu.querySelector('ul').appendChild(deleteBtn);
    // Create the SHARE button.
    const shareBtn = document.createElement('li');
    shareBtn.innerText = 'Share project';
    shareBtn.onclick = () => {
      App.shareProjectDialog.setUpDialog(App.projectsData[projIndex]);
      App.showModalDialog(App.shareProjectDialog.htmlContainer);
      App.modalDialogContainer.classList.add('grayTranslucent');
    }
    contextMenu.querySelector('ul').appendChild(shareBtn);
    // Create the RENAME button.
    const renameBtn = document.createElement('li');
    renameBtn.innerText = 'Rename';
    renameBtn.onclick = () => {
      App.renameProjectDialog.setUpDialog(projectItem);
      App.showModalDialog(App.renameProjectDialog.htmlContainer);
    }
    contextMenu.querySelector('ul').appendChild(renameBtn);
    const origin = {
      left: e.pageX,
      top: e.pageY
    };
    setPosition(origin);
  } else {
    if (menuVisible) toggleMenu("hide");
  }
});