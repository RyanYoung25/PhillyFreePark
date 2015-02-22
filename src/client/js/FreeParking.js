//Globals, gross, very gross

var myKey = "AIzaSyDEHivbXD5bQ76f0FqDM-keqo0K2XhRXbw";
var googlePlusClientID = "76329476181-7e60ohdu928f5m9hqo5pt5k9akeoncau.apps.googleusercontent.com";
var googlePlusSecret = "b8evh1RcJzdxb0YbWEfdcw7s";
var baseURL = "http://phillyfreeparking.com/";
//var baseURL = "http://localhost:8000/";

var styles = [
   {
     featureType: "poi",
     stylers: [
      { visibility: "off" }
     ]   
    }
];
var mapOptions = {
    zoom: 18,
    center: new google.maps.LatLng(39.9500, -75.1667), // default is Philly
    disableDefaultUI: true,
    styles: styles
};
var map = new google.maps.Map($("#map")[0],mapOptions);

var directionsService = new google.maps.DirectionsService();

// Handlebars stuff
var templateSource = $("#entry-template").html();
var template = Handlebars.compile(templateSource);

var infowindow = new google.maps.InfoWindow();

// Save all directions locally
// Saved in object for easy removal
var displayedDirections = {};
/*
displayedDirections: 
{
    ID: {
        polyline: polyline (google.maps.Polyline(), will also contain custom field 'streetID'),
        start: startLatLng,
        end: endLatLng,
        waypoints: [array of {lat: lat, lng: lng}],
        category: totally-a-category,
        verification: number,
        price: number,
        duration: number
    }
}
*/

var selectedParkingType = "Free";
var CATEGORY = {
    "Free": "green",
    "TwoHour": "orange",
    "FourHour": "blue",
    "NoParking": "red",
    "Meter": "yellow"
};

//Initialize 
$("body").load(function(){
    GUnload();
});


/**
 * Draw a line on the map and save to displayedDirections if the start and end points are on the same street
 * Drawn from a start latLng and and end latLng Draw a poly lineHeight
 *
 * @param: startLatLng - The starting LatLng coordinates
 *         endLatLng - The ending LatLng coordinates
 *         category - The type of line to color the street
 */
function drawStreet(startLatLng, endLatLng, category) {    
    var request1 = {
        origin: startLatLng,
        destination: endLatLng,
        travelMode: google.maps.TravelMode.DRIVING
    };
    var request2 = {
        origin: endLatLng,
        destination: startLatLng,
        travelMode: google.maps.TravelMode.DRIVING
    };

    var color;
    if (category in CATEGORY){
        color = CATEGORY[category];
    }
    else {
        console.log('Category: ' + category + " does not exist");
        color = "transparent";
    }

    var dist1 = 0, dist2 = 0, response1, response2;

    directionsService.route(request1, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {

            dist1 = response.routes[0].legs[0].distance.value; // first distance (in meters)
            response1 = response;

            directionsService.route(request2, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {

                    dist2 = response.routes[0].legs[0].distance.value; // first distance (in meters)
                    response2 = response;

                    if(checkStreet(startLatLng, endLatLng)){
                        var actualResponse;
                        var actualStart;
                        var actualEnd;
                        if (dist1 < dist2){
                            actualResponse = response1;
                            actualStart = startLatLng;
                            actualEnd = endLatLng;
                        }
                        else{
                            actualResponse = response2;
                            actualStart = endLatLng;
                            actualEnd = startLatLng;
                        }


                        var waypoints = actualResponse.routes[0].overview_path;

                        var literalWaypoints = [];
                        for (var i = 0; i < waypoints.length; i++){
                            literalWaypoints.push(latLngToLiteral(waypoints[i]));
                        }

                        var polyline = new google.maps.Polyline({
                            path: literalWaypoints,
                            geodesic: true,
                            strokeColor: color,
                            strokeOpacity: 1,
                            strokeWeight: 10,
                            map: map
                        });
                        addListener(polyline);

                        postParking(actualStart, actualEnd, category, literalWaypoints, function(parkingObject){
                            addStreet(parkingObject, polyline, actualStart, actualEnd, literalWaypoints, category);
                        });
                    }
                    else{
                        $(".invalidPoint").show("slow",function(){
                            setTimeout(function(){
                                $(".invalidPoint").hide("slow");
                            }, 2000);
                        });
                    }

                }
            });
        }
    });
};


function latLngToLiteral(latLng){
    return {lat: latLng.lat(), lng: latLng.lng()};
};


// Using geocode HTTP to get street names
function checkStreet(start, end){
    var street1 = null, street2 = null;
    var regex = /^[NSEW]\s/g;
    $.ajax({
        url: "https://maps.googleapis.com/maps/api/geocode/json?key=" + myKey + "&latlng=" + start.lat() + "," + start.lng(),
        async: false,
    }).success(function(geocodeResponse){
        var address_components = geocodeResponse.results[0].address_components;
        for (var i in address_components){
            if (address_components[i].types[0] === "route"){
                street1 = address_components[i].short_name.replace(regex, '');
            }
        }
    });
    $.ajax({
        url: "https://maps.googleapis.com/maps/api/geocode/json?key=" + myKey + "&latlng=" + end.lat() + "," + end.lng(),
        async: false,
    }).success(function(geocodeResponse){
        var address_components = geocodeResponse.results[0].address_components;
        for (var i in address_components){
            if (address_components[i].types[0] === "route"){
                street2 = address_components[i].short_name.replace(regex, '');
            }
        }
    });
    console.log("Start: " + street1);
    console.log("End: " + street2);
    return street1 === street2 && street1 !== null;
}

// Erase the street from the map, but still save it locally
function eraseStreet(streetID){
    displayedDirections[streetID].polyline.setMap(null);
};

// Add street to displayedDirections
function addStreet(parkingObject, polyline, start, end, waypoints, category){
    var ID = parkingObject.ID;
    polyline.streetID = ID;
    displayedDirections[ID] = {
        polyline: polyline,
        start: start,
        end: end,
        waypoints: waypoints,
        category: category,
        verification: parkingObject.Verified,
        price: parkingObject.Price,
        duration: parkingObject.Duration
    };
};

// Delete street from local storage AND erase it
function removeStreet(streetID){
    eraseStreet(streetID);
    delete displayedDirections[streetID];
};


/**
 * Send a starting and ending point to server
 * Receives all points in between the two points
 * @param: startLatLng - The starting LatLng coordinates
 *         endLatLng - The ending LatLng coordinates
 *         category - The type of line to color the street
 */
function postParking(startLatLng, endLatLng, category, waypoints, callback){
    var postParkingURL = baseURL + "?call=addparking&StartLng=" + startLatLng.lng() + "&StartLat=" + startLatLng.lat() + "&EndLng=" + endLatLng.lng() + "&EndLat=" + endLatLng.lat() + "&Category=" + category + "&Price=0&Duration=3&Waypoints=" + JSON.stringify(waypoints);
    $.get(postParkingURL).done(function(parkingObject){
        if (typeof parkingObject === "string")
            parkingObject = JSON.parse(parkingObject);
        if (typeof callback === "function"){
            callback(parkingObject);
        }
    }).fail(function(jqXHR, textStatus, errorThrown){
        console.log("Error sending data: " + errorThrown);
    });
}



/**
 * Add directions in parking list to displayedDirections if not in it
 * Remove direction from map if not in the viewport (but keep it in displayedDirections)
 */
function adjustParking(parkingList){
    // For each parking in the returned list,
    // if already not in map, display on map and add to object 
    for (var i in parkingList){
        var parkingObject = parkingList[i];
        var waypoints = null;
        if (parkingObject.Waypoints !== null)
            waypoints = JSON.parse(parkingObject.Waypoints);
        var origin = new google.maps.LatLng(parkingList[i].StartLat, parkingList[i].StartLng);
        var destination = new google.maps.LatLng(parkingList[i].EndLat, parkingList[i].EndLng);
        var category = parkingList[i].Category;
        var ID = parkingList[i].ID;

        if (!(ID in displayedDirections)){
            // Draw it
            if (waypoints !== null){
                var polyline = new google.maps.Polyline({
                    path: waypoints,
                    geodesic: true,
                    strokeColor: CATEGORY[category],
                    strokeOpacity: 1,
                    strokeWeight: 10,
                    map: map
                });
                addListener(polyline);

                addStreet(parkingObject, polyline, origin, destination, waypoints, category);
            }
            else {
                var marker = new google.maps.Marker({
                    map: map,
                    position: origin
                });
            }
        }
    }
}


// Listen to when polyline is clicked
function addListener(polyline){
    google.maps.event.addListener(polyline, 'click', function(event){
        var location = event.latLng;
        var id = this.streetID;
        infowindow.setContent(template({
            ID: id,
            verification: displayedDirections[id].verification,
            duration: displayedDirections[id].duration
        }));
        infowindow.setPosition(location);
        infowindow.open(map);
        $(".verify").click(function(){
            $(this).toggleClass("btn-primary btn-success");
            if ($(this).hasClass("btn-primary"))
                $(this).text("Verify");
            else
                $(this).text("Verified!");
        })
    });
}


function signinCallback(authResult) {
  if (authResult['status']['signed_in']) {
    // Update the app to reflect a signed in user
    // Hide the sign-in button now that the user is authorized, for example:
    document.getElementById('signinButton').setAttribute('style', 'display: none');
  } else {
    // Update the app to reflect a signed out user
    // Possible error values:
    //   "user_signed_out" - User is signed-out
    //   "access_denied" - User denied access to your app
    //   "immediate_failed" - Could not automatically log in the user
    console.log('Sign-in state: ' + authResult['error']);
  }
}


/**
 * Callback for selecting different parking types
 */
$(document).on('click', '.dropdown-menu li a', function () {
    // Display and hide the alert when selecing new parking option
    selectedParkingType = $(this).data("category");

    $(".parkingType").text($(this).text());
    $(".newParking").show("slow", function(){
        setTimeout(function(){
            $(".newParking").hide("slow");
        }, 1500);
    });
});


$(".close").click(function(){
    $(this).parent().hide();
});

// Position the menutab
$(".menutab").css("bottom", $(".menutab .tab").outerHeight()-$(".menutab").outerHeight() + "px");

$(".menutab .toggle").click(function(){
    if ($(this).find(".glyphicon").hasClass("glyphicon-chevron-down")){
        // is pulled up, will pull down
        $(".menutab").animate({
            "bottom": $(".menutab .tab").outerHeight()-$(".menutab").outerHeight() + "px"
        },"fast");
    }
    else {
        // is hiding down, will pull up
        $(".menutab").animate({
            "bottom": "0"
        },"fast");
    }
    $(this).find(".glyphicon").toggleClass("glyphicon-chevron-up glyphicon-chevron-down");
});


// The event listeners for the Map

var click1 = null;
var startMarker = new google.maps.Marker();
google.maps.event.addListener(map, 'click', function(event){
    var location = event.latLng;
    infowindow.close();

    if(click1 === null){
        startMarker.setMap(map);
        startMarker.setPosition(location);

        click1 = location;
    }
    else{
        drawStreet(click1, location, selectedParkingType);
        startMarker.setMap(null);
        click1 = null;
    }
});

// findparking -> in viewport
// eagerloading -> same as findparking but up to 2.5x width of viewport
// addparking -> give waypoints and others
google.maps.event.addListener(map, 'bounds_changed', function(event){
    var nextBounds = map.getBounds(); // LatLngBounds object
    var NEPoint = nextBounds.getNorthEast();
    var SWPoint = nextBounds.getSouthWest();

    console.log("NEPoint: " + NEPoint.toUrlValue());
    console.log("SWPoint: " + SWPoint.toUrlValue());

    var getBoundsURL = baseURL + "?call=findparking&LL_Lng=" + SWPoint.lng() + "&LL_Lat=" + SWPoint.lat() + "&UR_Lng=" + NEPoint.lng() + "&UR_Lat=" + NEPoint.lat();
    $.get(getBoundsURL).success(function(parkingList){
        if (typeof parkingList === "string")
            parkingList = JSON.parse(parkingList);

        // adds those in the parking list and not in the displayedDirections into the displayedDirections
        adjustParking(parkingList);

        var streetsToRemove = []; // temporary array of streets to remove after iteration
        for (var id in displayedDirections){
            var start = displayedDirections[id].start;
            var end = displayedDirections[id].end;

            if (!(nextBounds.contains(start) || nextBounds.contains(end))) {
                streetsToRemove.push(id);
            }
        }

        // remove the streets
        for (var i in streetsToRemove){
            removeStreet(streetsToRemove[i]);
        }

    }).fail(function(jqXHR, textStatus, errorThrown){
        console.log("Error sending data: " + errorThrown);
    });
    
});


