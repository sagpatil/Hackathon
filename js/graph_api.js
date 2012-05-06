//////////////////////////
//
// Graph API
// See https://developers.facebook.com/docs/reference/api/
//
//////////////////////////

//Detect when Facebook tells us that the user's session has been returned
FB.Event.monitor('auth.statusChange', function(session) {
  //If the user isn't logged in, set the body class so that we show/hide the correct elements
  if (session == undefined || session.status == 'not_authorized') {
    if (document.body.className != 'not_connected') {
      document.body.className = 'not_permissioned';
    }
  }
  //The user is logged in, so let's see if they've granted the check-in permission and pre-fetch some data
  //Depending on if they have or haven't, we'll set the body to reflect that so we show/hide the correct elements on the page
  else {
    preFetchData();
    
    FB.api({method: 'fql.query', query: 'SELECT user_checkins, publish_checkins FROM permissions WHERE uid = ' + session.authResponse['userID']}, function(response) {
      if (document.body.className != 'not_connected') {
        //We couldn't get a check-in for the user, so they haven't granted the permission
        if (response[0].user_checkins == 1) {
          document.body.className = 'permissioned';
        }
        //We were able to get a check-in for the user, so they have granted the permission already
        else {
          document.body.className = 'not_permissioned';
        }
      }
    });
  }
});

//Get the user's basic information
function getUserBasicInfo() {
  setAction('Getting your information', false);
  
  var markup = '<div class="data-header">Your information:</div>';
  
  //Update display of user name and picture
  if (FB.$('user-info')) {
    markup = markup + '<strong>User ID:</strong> ' + user.id + '<br />' + '<strong>Name:</strong> ' + user.name + '<br />' + '<strong>Profile picture URL:</strong> <a href="' + user.picture + '" target="_blank">' + user.picture + '</a><br />';
    FB.$('user-info').innerHTML = markup;
    
    clearAction();
  }
}

//Get the user's friends
function getUserFriends() {
  var markup = '<div class="data-header"></div><div style = "width :70%; margin : 20px auto;"><ul id="friends-list">';
  
  for (var i=0; i < friendsInfo.length; i++) {
    markup = markup + '<li onclick="doComparison(\'' + friendsInfo[i].name + '\',\'' + friendsInfo[i].id + '\',\'' + friendsInfo[i].picture + '\')" style = "list-style-type: none; height = 20%;"><img src="' + friendsInfo[i].picture + '">' + '&nbsp;&nbsp;&nbsp;<b>' + friendsInfo[i].name + '</b></li><br />';
  }
    
  markup = markup + "</ul></div>"
  FB.$('friends').innerHTML = markup; 

}

//Get the user's check-ins
function getCheckIns() {
  setAction('Getting check-ins', false);
  
  FB.api('/me/checkins', function(response) {
    console.log('Got your check-ins: ', response);
    
    clearAction();
    
    if (!response.error) {
      displayCheckIns(response.data, FB.$('checkins'));
    }
  });
}

//Display the user's check-ins
function displayCheckIns(checkins, dom) {
  var markup = '<div class="data-header">Your last five check-ins:</div>';
  
  for (var i=0; i < checkins.length && i < 5; i++) {
    var checkin = checkins[i];
    
    markup += '<div class="place">'
        + '<div class="picture"><img src="http://graph.facebook.com/' + checkin.place.id + '/picture"></div>'
        + '<div class="info">'
        + '  <div class="name">' + checkin.place.name + '</div>'
        + '  <div class="check-in-msg">' + (checkin.message || '') + '</div>'
        + '</div>'
      + '</div>';
  }
  
  dom.innerHTML = markup;
}

//Display the local places that the user can check into
function displayPlaces(places, dom) {
  var markup = '<div class="data-header">Nearby locations:</div>';
  
  for (var i=0; i < places.length && i < 5; i++) {
    var place = places[i];
    
    markup += '<div class="place">'
        + '<div class="picture"><img src="http://graph.facebook.com/' + place.id + '/picture"></div>'
        + '<div class="info">'
        + '  <div class="name">' + place.name + '</div>'
        + '  <div class="check-in-button"><input type="button" value="Check in" onclick="checkin(' + place.id + ')" /></div>'
        + '</div>'
      + '</div>';
  }
  
  dom.innerHTML = markup;
}

//Check the user into the place
function checkin(id) {
  setAction("Checking you in", false);
  
  var params = {
    method: 'POST',
    place: id,
    coordinates: {
      latitude: curLocation.coords.latitude,
      longitude: curLocation.coords.longitude
    },
    message: ''
  };

  console.log('Checking you into using the following params: ', params);
  
  FB.api('/me/checkins', params,
    function(response) {
      clearAction();
      
      console.log('Checked you into the place, here\'s the response: ', response);
      
      setAction("You've successfully checked in!", false);
      
      setTimeout('clearAction();', 2000);
    }
  );
}

//Get locations near the user
function getNearby() {
  setAction("Getting nearby locations", false);
  
  // First use browser's geolocation API to obtain location
  navigator.geolocation.getCurrentPosition(function(location) {
    curLocation = location;
    console.log(location);

    // Use graph API to search nearby places
    var path = '/search?type=place&center=' + location.coords.latitude + ',' + location.coords.longitude + '&distance=1000';
    
    FB.api(path, function(response) {
      clearAction();
      console.log('Got some places near you: ', response);
      if (!response.error) {
        displayPlaces(response.data, FB.$('locations-nearby'));
      }
    });
  });
}

//Prompt the user to grant the check-in permission
function promptCheckInPermission() {
  FB.login(function(response) {
    if (response.authResponse) {
      //User granted permissions
      document.body.className = 'permissioned';
    } 
    else {
      //User didn't grant permissions
      alert('You need to grant the check-in permission before using this functionality.');
    }
  }, {scope:'user_checkins,publish_checkins'});
}

//Pre-fetch data, mainly used for requests and feed publish dialog
var nonAppFriendIDs = [];
var appFriendIDs = [];
var friendIDs = [];
var friendsInfo = [];

function preFetchData() {
  //First, get friends that are using the app
  FB.api({method: 'friends.getAppUsers'}, function(appFriendResponse) {
    appFriendIDs = appFriendResponse;
  
    //Now fetch all of the user's friends so that we can determine who hasn't used the app yet
    FB.api('/me/friends', { fields: 'id, name, picture' }, function(friendResponse) {
      friends = friendResponse.data;
      
      //limit to a 200 friends so it's fast
      for (var k = 0; k < friends.length && k < 200; k++) {
        var friend = friends[k];
        var index = 1;
        
        friendIDs[k] = friend.id;
        friendsInfo[k] = friend;
        
        for (var i = 0; i < appFriendIDs.length; i++) {
          if (appFriendIDs[i] == friend.id) {
            index = -1;
          }
        }       
        
        if (index == 1) { 
          nonAppFriendIDs.push(friend.id);
        }
      }
      
      console.log('Got your friend\'s that use the app: ', appFriendIDs);
      
      console.log('Got all of your friends: ', friendIDs);
      
      console.log('Got friends that are not using the app yet: ', nonAppFriendIDs);
    });
  });
}

function fetchSportData() {
  var markup = '<div class="data-header">Sport Data not included yet:</div>';

  FB.api('12606341/endoapp:track/workout', function(sportResponse) {
		var data = sportResponse.data;
		var displayData = parseEndomondoSportData(data);
  	var text = markup + genSportResultString(displayData);
		var dom = FB.$('sport-data');
	 	dom.innerHTML = text;
	 	fetchSportData2();
	});
}

function fetchSportData2() {
  FB.api('551525361/endoapp:track/workout', function(sportResponse) {
		var data = sportResponse.data;
		var displayData = parseEndomondoSportData(data);
	 	var text = genSportResultString(displayData);
		var dom = FB.$('sport-data-friend');
	 	dom.innerHTML = text;
	 	fetchSportData3();
	});
}

function fetchSportData3() {
	FB.api('12606341/mapmyrideapp:did/workout', function(sportResponse) {
		var data = sportResponse.data;
		var displayData = parseMapMyRunSportData(data);
  	var text = genSportResultString(displayData);
		var dom = FB.$('sport-data');
	 	dom.innerHTML = dom.innerHTML + text;
	 	fetchSportData4();
	});
}

function fetchSportData4() {
	FB.api('551525361/mapmyrideapp:did/workout', function(sportResponse) {
		var data = sportResponse.data;
		var displayData = parseMapMyRunSportData(data);
  	var text = genSportResultString(displayData);
		var dom = FB.$('sport-data-friend');
	 	dom.innerHTML = dom.innerHTML + text;
	});
}


function genSportResultString(displayData, name) {
 return '<div class="info">'
        + '  <div class="name"> <b>' + name + '</b> worked out <b> ' + displayData[1] + ' </b> time(s) for <b>' + (displayData[2] / 60.0 / 60.0).toFixed(2) + '</b> hours and ran ' + displayData[0].toFixed(2) + ' miles.</div>'
        + '</div>';
}

function parseEndomondoSportData(data) {

	var totalDistance = 0;
	var totalWorkouts = 0;
	var totalDuration = 0;

	for (var i=0; i < data.length; i++) {
		var workout = data[i];
		var workoutData = workout.data;
		if (workoutData.unit == 'km') {
			totalDistance += workoutData.distance * 0.62;
		} else {
			totalDistance += workoutData.distance;
		}
	
		totalDuration += workoutData.duration;
	}
	totalWorkouts = data.length;

	var output = new Array();
	output[0] = totalDistance;
	output[1] = totalWorkouts;
	output[2] = totalDuration;
	return output;
}

function parseMapMyRunSportData(data) {

	var totalDistance = 0;
	var totalWorkouts = 0;
	var totalDuration = 0;

	for (var i=0; i < data.length; i++) {
		var workout = data[i];
		var workoutData = workout.data;
		var distanceStrLength = workoutData.distance.length;
		var unit = workoutData.distance.substring(distanceStrLength - 2, distanceStrLength)
		if (unit == 'km') {
			totalDistance += workoutData.distancevalue * 0.62;
		} else {
			totalDistance += workoutData.distancevalue;
		}	
		totalDuration += workoutData.durationvalue;
	}
	totalWorkouts = data.length;

	var output = new Array();
	output[0] = totalDistance;
	output[1] = totalWorkouts;
	output[2] = totalDuration;
	return output;
}

function doComparison(name, id, picture) {
  var sportData = {};
  sportData.name = name;
  sportData.picture = picture;
  sportData.id = id;
	storeSportData(id, sportData);

  openPage('Social-Plugins');  
	var resultDataAll = new Array();
	fetchSportDataAll(resultDataAll, id);
}

function doComparisonComplete(resultDataAll, friendId) {
	var sportData = getSportData(friendId);
	var html = '<div style = "width:70%;margin:20px auto; font-size:17px;color: #666">';
	var dom = FB.$('yourstats');
	dom.innerHTML = genSportResultString(resultDataAll[0], 'You');
	var dom = FB.$('friendstats');
	dom.innerHTML = genSportResultString(resultDataAll[1], sportData.name);
	var dom = FB.$('statresults');

	if (resultDataAll[0][0] > resultDataAll[1][0]) {
		dom.innerHTML = 'You were out running more...asked ' + sportData.name + ' to join you next time </div>';
	} else {
		dom.innerHTML = 'You need to get out there more...meet up with ' + sportData.name + ' for running</div>';	
	}
}

function fetchSportDataAll(resultDataAll, friend) {
  var markup = '<div class="data-header">Sport Data not included yet:</div>';

  FB.api('me/endoapp:track/workout', function(sportResponse) {
		var data = sportResponse.data;
		var displayData = parseEndomondoSportData(data);
		resultDataAll[0] = displayData;
	 	fetchSportData2All(resultDataAll, friend);
	});
}

function fetchSportData2All(resultDataAll, friend) {
  FB.api(friend + '/endoapp:track/workout', function(sportResponse) {
		var data = sportResponse.data;
		var displayData = parseEndomondoSportData(data);
		resultDataAll[1] = displayData;
	 	fetchSportData3All(resultDataAll, friend);
	});
}

function fetchSportData3All(resultDataAll, friend) {
	FB.api('me/mapmyrideapp:did/workout', function(sportResponse) {
		var data = sportResponse.data;
		var displayData = parseMapMyRunSportData(data);
		resultDataAll[2] = displayData;
	 	fetchSportData4All(resultDataAll, friend);
	});
}

function fetchSportData4All(resultDataAll, friend) {
	FB.api(friend + '/mapmyrideapp:did/workout', function(sportResponse) {
		var data = sportResponse.data;
		var displayData = parseMapMyRunSportData(data);
		resultDataAll[3] = displayData;
		doComparisonComplete(resultDataAll, friend);
	});
}