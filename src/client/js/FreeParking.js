//Globals, gross, very gross

var mapOptions = {
    zoom: 15,
    center: new google.maps.LatLng(39.9500, -75.1667),
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
function drawStreet(startLatLng, endLatLng, category) {
    
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
            color = "#550022"
            break;
        case "TwoHour":
            color = "#009900"
            break;
        case "FourHour":
            color = "#000022"
            break;
        case "NoParking":
            color = "#502122"
            break;
        case "Meter":
            color = "#AAF051"
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
            var start = response.routes[0].legs[0].start_address;
            var end = response.routes[0].legs[0].end_address;

            //Check to see if the points are on the same street
            var startArray = start.split(",");
            var endArray = end.split(",");

            var regex = /\d+[a-zA-Z]?(-\d+[a-zA-Z]?)?\s/g;
            var startStreetName = startArray[0].replace(regex, '');
            var endStreetName = endArray[0].replace(regex, ''); 

            if(startStreetName == endStreetName){
                var directions = new google.maps.DirectionsRenderer({
                    suppressMarkers: true,
                    map: map
                });
                directions.setOptions({polylineOptions: streetLine});
                directions.setDirections(response);
                directions.category = category; // add custom key
                addStreet(directions);
            }
            else{
                console.log("Your streets aren't the same");
                console.log(startStreetName);
                console.log(endStreetName);
            }
        }
    });
};

// Erase the street from the map, but still save it locally
function eraseStreet(streetID){
    displayedDirections[streetID].setMap(null);
};

// Add street to displayedDirections
function addStreet(directions){
    // Replace the key with whatever ID it is later
    displayedDirections[Object.keys(displayedDirections).length] = directions;
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


/**
 * Send a starting and ending point to server
 * Receives all points in between the two points
 * @param: startLatLng - The starting LatLng coordinates
 *         endLatLng - The ending LatLng coordinates
 *         category - The type of line to color the street
 */
function postParking(startLatLng, endLatLng, category){
    $.post("http://phillyfreepark.com/api",{ // or whatever the actual URL is
        start: startLatLng,
        end: endLatLng,
        category: category
    }).success(function(parkingList){
        adjustParking(parkingList);
    }).fail(function(jqXHR, textStatus, errorThrown){
        alert("Error sending data: " + errorThrown);
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

        // all locations returned in parkingList are in the new bounds
        if (!(parkingList.ID in displayedDirections)){
            addStreet(parkingList.ID);
        }
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
        drawStreet(click1, location, selectedParkingType);
        click1 = null;
    }

    addMarker(location);
});

google.maps.event.addListener(map, 'bounds_changed', function(event){
    var nextBounds = map.getBounds(); // LatLngBounds object
    var center = map.getCenter(); // latLbng object

    $.post("http://phillyfreepark.com/whatever-api-temprary-name",{ // or whatever the actual URL is
        nextBounds: nextBounds
    }).success(function(parkingList){
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
        alert("Error sending data: " + errorThrown);
    });

});

