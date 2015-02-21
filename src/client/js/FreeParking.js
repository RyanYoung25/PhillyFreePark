//Globals, gross, very gross

var mapOptions = {
    zoom: 15,
    center: new google.maps.LatLng(39.9500, -75.1667)
};
var map = new google.maps.Map($("#map")[0],mapOptions); 

var directionsDisplay = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
    map: map
});

var directionsService = new google.maps.DirectionsService();

// Stores array of all paths to be drawn
var parkingRoutes = [];


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
                directionsDisplay.setOptions({polylineOptions: streetLine});
                directionsDisplay.setDirections(response);
            }
            else
            {
                console.log("Your streets aren't the same");
                console.log(startStreetName);
                console.log(endStreetName);
            }
        }
    });
}


var click1 = null;

google.maps.event.addListener(map, 'click', function(event){
    var location = event.latLng;

    var marker = new google.maps.Marker({
        position: location
    });

    if(click1 == null)
    {
        click1 = location;
    }
    else 
    {
        drawStreet(click1, location, "Meter");
        click1 = null;
    }
});


/**
 * Send a starting and ending point to server
 * Receives all points in between the two points
 * @param: startLatLng - The starting LatLng coordinates
 *         endLatLng - The ending LatLng coordinates
 *         category - The type of line to color the street
 */
function sendData(startLatLng, endLatLng, category){
    $.post("http://phillyfreepark.com/api",{
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
        position: myLatlng,
        map: map,
        title: 'Hello World!'
    });
}



// Callback for selecting different parking types
$(document).on('click', '.dropdown-menu li a', function () {
    console.log("Selected Option: " + $(this).text());
});


// Test:
/*function test(){
    drawStreet(new google.maps.LatLng(53.79370554255467, -2.991950511932373), new google.maps.LatLng(53.79369286762782, -2.988302707672119), "Meter");
}
$("#Test").click(test());*/
