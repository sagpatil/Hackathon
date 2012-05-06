//////////////////////////
//
// UI assist functions
//
//////////////////////////

//show a loading screen when launched, until we get the user's session back
setAction("Loading Hackbook", true);

getSportyFriends();

function getSportyFriends() {
  var markup = '<h1>Your Sporty Friends!!</h1>';
  friendsInfo = new Array();
  for (var i=0, l=localStorage.length; i<l; i++){
        var key = localStorage.key(i);
      //  var value = localStorage[key];
        friendsInfo[i] = getSportData(key);
}
  //friendsInfo = new Array(getSportsData(12606341),getSportsData(551525361));
  for (var i=0; i < friendsInfo.length && i < 25; i++) {
    markup = markup + '<img src="' + friendsInfo[i].picture + '">' + '&nbsp;&nbsp;&nbsp;<b>' + friendsInfo[i].name + '</b><br />';
  }
  
  FB.$('sporty-friends').innerHTML = markup;
}

function storeSportData(id, storeData) {
  
localStorage.setItem(id, JSON.stringify(storeData));
console.log('storing Object: ', +JSON.stringify(storeData));

}

function getSportData(id){
  
  var retrievedObject = JSON.parse(localStorage.getItem(id));
  console.log('stored Object: ', +retrievedObject);
  if(retrievedObject != null)
  {
    return retrievedObject;
  }
  else return {};
}

//Swaps the pages out when the user taps on a choice
function openPage(pageName, ignoreHistoryPush) {
  window.scrollTo(0,1);

  var els = document.getElementsByClassName('page');
  
  for (var i = 0 ; i < els.length ; ++i) {
    els[i].style.display = 'none';
  }
  
  var page = document.getElementById('page-' + pageName);
  
  page.style.display = "block";
  
  title = "BeSporty-GetHealthy";
  document.getElementById('title').innerHTML = title;
  
  if (ignoreHistoryPush != true) {
    window.history.pushState({page: pageName}, '', document.location.origin + document.location.pathname + "#" + pageName);
  }

  document.getElementById('back').style.display = (pageName == 'root') ? 'none' : 'block';
}

window.onpopstate = function(e) {
  if (e.state != null) {
    console.log(e.state);
    openPage(e.state.page);
  }
  else {
    openPage('root', true);
  }
}

openPage('root', true);

//Shows a modal dialog when fetcing data from Facebook
function setAction(msg, hideBackground) {
  document.getElementById('action').style.display = 'block';
  
  if (hideBackground) {
    document.getElementById('action').style.opacity = '100';
  }
  else {
    document.getElementById('action').style.opacity = '.9';
  }
  
  FB.$('msg').innerHTML = FB.String.escapeHTML(msg);
  
  window.scrollTo(0, 1);
}

//Clears the modal dialog
function clearAction() {
  FB.$('msg').innerHTML = '';
  
  document.getElementById('action').style.display = 'none';
}

//Automatically scroll away the address bar
addEventListener("load", function() { setTimeout(hideURLbar, 0); }, false);

function hideURLbar() {
  window.scrollTo(0,1);
}

function hideButton(button) {
  button.style.display = 'none';
}