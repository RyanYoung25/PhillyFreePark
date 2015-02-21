//Globals, gross, very gross

var myKey = "AIzaSyDEHivbXD5bQ76f0FqDM-keqo0K2XhRXbw";

var mapOptions = {
    zoom: 15,
    center: new google.maps.LatLng(39.9500, -75.1667), // default is Philly
    disableDefaultUI: true
};
var map = new google.maps.Map($("#map")[0],mapOptions);

// Initialize first eager loading bounds
var eagerLoadingBounds = map.getBounds();

var directionsService = new google.maps.DirectionsService();

// Save all markers (google.maps.Marker()) locally
var markers = [];

// Save all directions (google.maps.DirectionsRenderer()) locally
// Saved in object for easy removal
var displayedDirections = {};

var selectedParkingType = "Free";

//Initialize 
$("body").load(function(){
    GUnload();
});


/**
 * Draw a line on the map and save to displayedDirections if the start and end points are on the same street
 * Drawn from a start latLng and and end latLng Draw a poly lineHeight
 * @param: startLatLng - The starting LatLng coordinates
 *         endLatLng - The ending LatLng coordinates
 *         category - The type of line to color the street
 */
function drawStreet(startLatLng, endLatLng, category, streetID) {
    
    //From google-developers example code
    var request = {
        origin:startLatLng,
        destination:endLatLng,
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
    //Make the line path
    var streetLine = new google.maps.Polyline({
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 10
    });

    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            if(checkStreet(startLatLng, endLatLng)){
                var directions = new google.maps.DirectionsRenderer({
                    suppressMarkers: true,
                    map: map
                });
                directions.setOptions({polylineOptions: streetLine});
                directions.setDirections(response);
                directions.category = category; // add custom key

                addStreet(streetID, {start: startLatLng, end: endLatLng});
            }
            else{
                console.log("Your streets aren't the same");
            }
        }
    });
};

function checkStreet(start, end){
    var street1 = null, street2 = null;
    $.ajax({
        url: "https://maps.googleapis.com/maps/api/geocode/json?key=" + myKey + "&latlng=" + start.lat() + "," + start.lng(),
        async: false,
    }).success(function(geocodeResponse){
        var address_components = geocodeResponse.results[0].address_components;
        for (var i in address_components){
            if (address_components[i].types[0] === "route"){
                street1 = address_components[i].long_name;
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
                street2 = address_components[i].long_name;
            }
        }
    });
    console.log("Start: " + street1);
    console.log("End: " + street2);
    return street1 === street2 && street1 !== null;
}

// Erase the street from the map, but still save it locally
function eraseStreet(streetID){
    displayedDirections[streetID].setMap(null);
};

// Add street to displayedDirections
function addStreet(ID, startEnd){
    displayedDirections[ID] = startEnd;
};

// Delete street from local storage AND erase it
function removeStreet(streetID){
    eraseStreet(streetID);
    delete displayedDirections[streetID];
};

// Removes all streets and markers from the map
function clearAllStreets(){
    for (var i in displayedDirections) {
        displayedDirections[i].setMap(null);
    }
    displayedDirections = {};
    clearAllMarkers();
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
        drawStreet(startLatLng, endLatLng, category, parkingObject.ID);
    }).fail(function(jqXHR, textStatus, errorThrown){
        console.log("Error sending data: " + errorThrown);
    });
}

/**
 * Add directions in parking list to displayedDirections if not in it
 * Remove direction from map if not in the viewport (but keep it in dispalyedDirections)
 */
function adjustParking(parkingList){
    // For each parking in the returned list,
    // if already not in map, display on map and add to object 
    for (var i in parkingList){
        var origin = new google.maps.LatLng(parkingList[i].StartLat, parkingList[i].StartLong);
        var destination = new google.maps.LatLng(parkingList[i].StartLat, parkingList[i].StartLong);;
        var category = parkingList[i].Category;
        var ID = parkingList[i].ID;

        // all locations returned in parkingList are in the new bounds
        /*if (!(ID in displayedDirections)){
            addStreet(parkingList.ID, {start: origin, });
        }*/
    }
};


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
google.maps.event.addListener(map, 'click', function(event){
    var location = event.latLng;

    var marker = new google.maps.Marker({
        position: location
    });

    if(click1 == null){
        clearAllMarkers();
        click1 = location;
    }
    else{
        postParking(click1, location, selectedParkingType);
        click1 = null;
    }

    addMarker(location);
});


var postBoundsURL = baseURL + "/postBounds.php"
/*google.maps.event.addListener(map, 'bounds_changed', function(event){
    var nextBounds = map.getBounds(); // LatLngBounds object
    var NEPoint = nextBounds.getNorthEast();
    var SWPoint = nextBounds.getSouthWest();
    var center = map.getCenter(); // latLbng object

    $.post(postBoundsURL,{ // or whatever the actual URL is
        NELat: NEPoint.lat(),
        NELon: NEPoint.lng(),
        SWLat: SWPoint.lat(),
        SWLon: SWPoint.lng() 
    }).done(function(parkingList){
        adjustParking(parkingList);

        var streetsToRemove = []; // temporary array of streets to remove after iteration
        for (var i in displayedDirections){
            var directions = displayedDirections[i];
            var routeLength = directions.routes.length
            var start = directions.routes[0].legs[0].start_location;
            var end = directions.routes[routeLength-1].legs[0].end_location;

            if (nextBounds.contains(start) && nextBounds.contains(end)){
                drawStreet(start, end, directions.category);
            }
            else {
                streetsToRemove.push(i);
            }
        }

        // remove the streets
        for (var i in streetsToRemove){
            removeStreet(streetsToRemove[i]);
        }
    }).fail(function(jqXHR, textStatus, errorThrown){
        console.log("Error sending data: " + errorThrown);
    });

});*/


