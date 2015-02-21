//Globals, gross, very gross

var mapOptions = {
    zoom: 15,
    center: new google.maps.LatLng(39.9500, -75.1667),
    disableDefaultUI: true
};
var map = new google.maps.Map($("#map")[0],mapOptions); 

var directionsService = new google.maps.DirectionsService();

// Stores array of all paths to be drawn
var parkingRoutes = [];

// Save all markers (google.maps.Marker()) locally
var markers = [];

// Save all directions (google.maps.DirectionsRenderer()) locally
// Saved in object for easy removal
var directionsDisplays = {};

var selectedParkingType = "Free";

//Initialize 
$("body").load(function(){
    GUnload();
});


/**
 *From a start latLng and and end latLng Draw a poly lineHeight
 * @param: startLatLng - The starting LatLng coordinates
 *         endLatLng - The ending LatLng coordinates
 *         category - The type of line to color the street
 */
function drawStreet(startLatLng, endLatLng, category)
{
    
    //From google-developers example code
    var request = {
        origin:startLatLng,
        destination:endLatLng,
        travelMode: google.maps.TravelMode.DRIVING
    };
    
    var streetPath =[
        startLatLng,
        endLatLng
    ];

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

            if(startStreetName == endStreetName)
            {
                var directions = new google.maps.DirectionsRenderer({
                    suppressMarkers: true,
                    map: map
                });
                directions.setOptions({polylineOptions: streetLine});
                directions.setDirections(response);
                directionsDisplays[Object.keys(directionsDisplays).length] = directions;
            }
            else
            {
                console.log("Your streets aren't the same");
                console.log(startStreetName);
                console.log(endStreetName);
            }
        }
    });
};


function removeStreet(streetID){
    delete directionsDisplays[streetID];
};


/**
 * Send a starting and ending point to server
 * Receives all points in between the two points
 * @param: startLatLng - The starting LatLng coordinates
 *         endLatLng - The ending LatLng coordinates
 *         category - The type of line to color the street
 */
function sendData(startLatLng, endLatLng, category){
    $.post("http://phillyfreepark.com/api",{ // or whatever the actual URL is
        start: startLatLng,
        end: endLatLng,
        category: category
    }).success(function(responseData){
        // DO stuf with the points
    }).fail(function(jqXHR, textStatus, errorThrown){
        alert("Error sending data: " + errorThrown);
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
    markers.push(marker);
}

// Removes the markers from the map
function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

// Removes paths and markers from the map
function clearPaths(){
    for (var i in directionsDisplays) {
        directionsDisplays[i].setMap(null);
    }
    directionsDisplays = {};
    clearMarkers();
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


$("#resetPaths").click(clearPaths);
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

    if(click1 == null)
    {
        clearMarkers();
        click1 = location;
    }
    else 
    {
        drawStreet(click1, location, selectedParkingType);
        click1 = null;
    }

    addMarker(location);
});

google.maps.event.addListener(map, 'bounds_changed', function(event){

});

