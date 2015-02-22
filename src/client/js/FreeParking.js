//Globals, gross, very gross

var myKey = "AIzaSyDEHivbXD5bQ76f0FqDM-keqo0K2XhRXbw";

var mapOptions = {
    zoom: 17,
    center: new google.maps.LatLng(39.9500, -75.1667), // default is Philly
    disableDefaultUI: true
};
var map = new google.maps.Map($("#map")[0],mapOptions);

// Initialize first eager loading bounds
var eagerLoadingBounds = map.getBounds();

var directionsService = new google.maps.DirectionsService();

// Save all markers (google.maps.Marker()) locally
var markers = [];

// Save all directions locally
// Saved in object for easy removal
var displayedDirections = {};
/*
displayedDirections: 
{
    ID: {
        directions: directions (google.maps.DirectionsRenderer()),
        start: startLatLng,
        end: endLatLng,
        waypoints: [array of {lat: lat, lng: lng}],
        category: totally-a-category
    }
}
*/

var selectedParkingType = "Free";

//Initialize 
$("body").load(function(){
    GUnload();
});


/**
 * Draw a line on the map and save to displayedDirections if the start and end points are on the same street
 * Drawn from a start latLng and and end latLng Draw a poly lineHeight
 *
 * CALL THIS ONLY IF THE STREETID IS NOT ON THE DATABASE!!!!!!
 *
 * @param: startLatLng - The starting LatLng coordinates
 *         endLatLng - The ending LatLng coordinates
 *         category - The type of line to color the street
 */
function drawStreet(startLatLng, endLatLng, category, streetID) {    
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

    var color = '';
    //Switch for color
    switch(category){
        case "Free":
            color = "red";
            break;
        case "TwoHour":
            color = "orange";
            break;
        case "FourHour":
            color = "blue";
            break;
        case "NoParking":
            color = "purple";
            break;
        case "Meter":
            color = "green";
            break;
        default:
            console.log('Category: ' + category + " does not exist");
            color = "transparent";
            break;
    }

    var dist1 = 0, dist2 = 0, response1, response2;

    directionsService.route(request1, function(response, status) {
        console.log(status);
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
                        var polyline = new google.maps.Polyline({
                            path: waypoints,
                            geodesic: true,
                            strokeColor: color,
                            strokeOpacity: 1,
                            strokeWeight: 10
                        });
                        polyline.setMap(map);
                        /*
                        [{
                            lat: lat,
                            lon: lon.
                        },{
                            lat: lat,
                            lon: lon.
                        }]
                        */

                        //console.log(JSON.parse(JSON.stringify(actualResponse)));
                        //directions.setDirections(JSON.parse(JSON.stringify(actualResponse)));
                        //directions.setDirections(actualResponse);
                        //console.log(JSON.stringify(actualResponse));
                        addStreet(streetID, polyline, actualStart, actualEnd);

                    }
                    else{
                        console.log("Your streets aren't the same");
                    }

                }
            });
        }
    });
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
    displayedDirections[streetID].directions.setMap(null);
};

// Add street to displayedDirections
function addStreet(ID, directions, start, end, marker){
    displayedDirections[ID] = {
        directions: directions,
        start: start,
        end: end,
        marker: marker
    };
};

// Delete street from local storage AND erase it
function removeStreet(streetID){
    eraseStreet(streetID);
    delete displayedDirections[streetID];
};

// Removes all streets and markers from the map
function clearAllStreets(){
    for (var id in displayedDirections) {
        eraseStreet(id);
    }
    displayedDirections = {};
};


var baseURL = "http://localhost:8000";
var postParkingURL = baseURL + "/postPath.php";
/**
 * Send a starting and ending point to server
 * Receives all points in between the two points
 * @param: startLatLng - The starting LatLng coordinates
 *         endLatLng - The ending LatLng coordinates
 *         category - The type of line to color the street
 */
function postParking(startLatLng, endLatLng, category){
    $.post(postParkingURL, { // or whatever the actual URL is
        StartLat: startLatLng.lat(),
        StartLong: startLatLng.lng(),
        EndLat: endLatLng.lat(),
        EndLong: endLatLng.lng(),
        Category: category
    }).success(function(parkingObject){
        parkingObject = JSON.parse(parkingObject);
        drawStreet(startLatLng, endLatLng, category, parkingObject.ID);
    }).fail(function(jqXHR, textStatus, errorThrown){
        console.log("Error sending data: " + errorThrown);
    });
}


/**
 * Add a point on the map
 * @param: location - The LatLng coordinates
 */
function addMarker(location) {
    var marker = new google.maps.Marker({
        position: location,
        map: map
    });
    console.log("lat: " + location.lat());
    console.log("lng: " + location.lng());
    markers.push(marker);
}

// Removes the markers from the map
function clearAllMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}


/**
 * Callback for selecting different parking types
 */
$(document).on('click', '.dropdown-menu li a', function () {
    // Display and hide the alert when selecing new parking option
    $("#parkingType").text($(this).text());
    selectedParkingType = $(this).data("category");
    $(".alert").show(10,function(){
        setTimeout(function(){
            $(".alert").hide(1000);
        }, 1000);
    });
});


$("#resetPaths").click(clearAllStreets());
$('.btn-group button').click(function(){
    $(this).parent().children().removeClass('active');
});


// The event listeners for the Map

var click1 = null;
var startMarker = new google.maps.Marker();
var endMarker = new google.maps.Marker();
google.maps.event.addListener(map, 'click', function(event){
    var location = event.latLng;

    var marker = new google.maps.Marker({
        position: location
    });

    if(click1 == null){
        startMarker.setMap(map);
        startMarker.setPosition(location);
        endMarker.setMap(null);

        click1 = location;
    }
    else{
        postParking(click1, location, selectedParkingType);
        endMarker.setMap(map);
        endMarker.setPosition(location);
        click1 = null;
    }

});


/**
 * Add directions in parking list to displayedDirections if not in it
 * Remove direction from map if not in the viewport (but keep it in displayedDirections)
 */
function adjustParking(parkingList){
    var bounds = map.getBounds();

    // For each parking in the returned list,
    // if already not in map, display on map and add to object 
    for (var i in parkingList){
        var origin = new google.maps.LatLng(parkingList[i].StartLat, parkingList[i].StartLong);
        var destination = new google.maps.LatLng(parkingList[i].EndLat, parkingList[i].EndLong);;
        var category = parkingList[i].Category;
        var ID = parkingList[i].ID;

        // all locations returned in parkingList are in the new bounds
        if (!(ID in displayedDirections)){
            drawStreet(origin, destination, category, ID);
        }
    }
};


var postBoundsURL = baseURL + "/postBounds.php"
google.maps.event.addListener(map, 'bounds_changed', function(event){
    var nextBounds = map.getBounds(); // LatLngBounds object
    var NEPoint = nextBounds.getNorthEast();
    var SWPoint = nextBounds.getSouthWest();
    var zoom = map.getZoom();

    console.log(zoom);

    /*$.post(postBoundsURL,{ // or whatever the actual URL is
        NELat: NEPoint.lat(),
        NELng: NEPoint.lng(),
        SWLat: SWPoint.lat(),
        SWLng: SWPoint.lng() 
    }).success(function(parkingList){
        parkingList = JSON.parse(parkingList);

        // adds those in the parking list and not in the displayedDirections into the displayedDirections
        adjustParking(parkingList);

        if (zoom > zoomLimit){
            for (var id in displayedDirections){
                var start = displayedDirections[id].start;
                var end = displayedDirections[id].end;
                var dirMap = displayedDirections[id].directions.getMap();

                if (nextBounds.contains(start) && nextBounds.contains(end) && dirMap === null) {
                    displayedDirections[id].directions.setMap(map);
                }

                displayedDirections[id].marker.setMap(null);
            }
        }
        else {
            // Erase all streets
            for (var id in displayedDirections){
                var start = displayedDirections[id].start;
                var end = displayedDirections[id].end;
                var markerMap = displayedDirections[id].marker.getMap();

                if (nextBounds.contains(start) && nextBounds.contains(end) && markerMap === null){
                    displayedDirections[id].marker.setMap(map);
                }

                displayedDirections[id].directions.setMap(null);
            }
        }

        var streetsToRemove = []; // temporary array of streets to remove after iteration
        for (var id in displayedDirections){
            var start = displayedDirections[id].start;
            var end = displayedDirections[id].end;

            if (!(nextBounds.contains(start) && nextBounds.contains(end))) {
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

    
    if (zoom > zoomLimit){
        for (var id in displayedDirections){
            var start = displayedDirections[id].start;
            var end = displayedDirections[id].end;
            var dirMap = displayedDirections[id].directions.getMap();

            if (nextBounds.contains(start) && nextBounds.contains(end) && dirMap === null) {
                displayedDirections[id].directions.setMap(map);
            }

            displayedDirections[id].marker.setMap(null);
        }
    }
    else {
        // Erase all streets
        for (var id in displayedDirections){
            var start = displayedDirections[id].start;
            var end = displayedDirections[id].end;
            var markerMap = displayedDirections[id].marker.getMap();

            if (nextBounds.contains(start) && nextBounds.contains(end) && markerMap === null){
                displayedDirections[id].marker.setMap(map);
            }

            displayedDirections[id].directions.setMap(null);
        }
    }*/
    
});


