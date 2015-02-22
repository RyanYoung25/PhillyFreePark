<?php

include('globals.php');

// Our call names and their required parameters
$calls = array(
    "findparking" => array("LL_Lng","LL_Lat","UR_Lng","UR_Lat"),
    "eagerload" => array("LL_Lng","LL_Lat","UR_Lng","UR_Lat"),
    "addparking" => array("StartLng","StartLat","EndLng","EndLat",
        "Category","Price","Duration","Waypoints"),
    "deleteparking" => array("ID")

);

// Other settings
define("EAGERLOADMULTIPLE", 2.5);

// Pull the function name out of the request
$call = $_REQUEST['call'];

// Make sure we have a function call provided
if($call == null || $calls[$call] == null){
    exit("No call or invalid call provided");
}

// Make sure we have all the necessary params
foreach($calls[$call] as $param){
    if($_REQUEST[$param] == null){
        exit("Required parameter '$param' not provided");
    }
}


//We're using the DB on this page, so let's connect
connectToDB();


if($call == "findparking") {
    findparking($_REQUEST["LL_Lng"],$_REQUEST["LL_Lat"],$_REQUEST["UR_Lng"],
        $_REQUEST["UR_Lat"]);
}
else if($call == "eagerload") {
    findparking($_REQUEST["LL_Lng"],$_REQUEST["LL_Lat"],$_REQUEST["UR_Lng"],
        $_REQUEST["UR_Lat"]);
}
else if($call == "addparking") {
    addparking($_REQUEST["StartLng"],$_REQUEST["StartLat"],$_REQUEST["EndLng"],
        $_REQUEST["EndLat"], $_REQUEST["Category"],$_REQUEST["Price"],
        $_REQUEST["Duration"],$_REQUEST["Waypoints"]);
}
else if($call == "deleteparking") {
    deleteparking($_REQUEST["ID"]);
}


/******************************************************************************
 * Our actual API function calls
 *****************************************************************************/

/**
 * @param $LL_Lng Lower Left Longitude
 * @param $LL_Lat Lower Left Latitude
 * @param $UR_Lng Upper Right Longitude
 * @param $UR_Lat Upper Right Latitude
 */
function findparking($LL_Lng,$LL_Lat,$UR_Lng,$UR_Lat){
    global $siteContentDB;

    $parking_list = array();

    if(mysqli_connect_errno($siteContentDB)) {
        echo ("Failed to connect to MySQL DB: " . mysqli_connect_error());
    }
    else {
        // Build the query
        $query = "SELECT * FROM parking WHERE
                  (
                  $LL_Lng <= StartLng AND StartLng <= $UR_Lng
                    AND $LL_Lat <= StartLat AND StartLat <= $UR_Lat
                    )
                  OR
                  (
                  $LL_Lng <= EndLng AND EndLng <= $UR_Lng
                    AND $LL_Lat <= EndLat AND EndLat <= $UR_Lat
                  )
                  ";

                // Query the DB
        if ($result = $siteContentDB->query($query)) {
            // Iterate through the results
             while ($parking = $result->fetch_object()) {
                //Push the object to the parking list
                 //echo(json_encode($parking));
                array_push($parking_list,$parking);
            }
        }

        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
        echo(json_encode($parking_list));

    }
}

/**
 * @param $LL_Lng Lower Left Longitude
 * @param $LL_Lat Lower Left Latitude
 * @param $UR_Lng Upper Right Longitude
 * @param $UR_Lat Upper Right Latitude
 */
function eagerload($LL_Lng,$LL_Lat,$UR_Lng,$UR_Lat){
    global $siteContentDB;

    $viewportWidth = $UR_Lng - $LL_Lng;
    $viewportHeight = $UR_Lat - $LL_Lat;

    $LL_Lng = $LL_Lng - (0.5*EAGERLOADMULTIPLE*$viewportWidth);
    $UR_Lng = $UR_Lng - (0.5*EAGERLOADMULTIPLE*$viewportWidth);
    $LL_Lat = $LL_Lat - (0.5*EAGERLOADMULTIPLE*$viewportHeight);
    $UR_Lat = $UR_Lat - (0.5*EAGERLOADMULTIPLE*$viewportHeight);

    $parking_list = array();

    if(mysqli_connect_errno($siteContentDB)) {
        echo ("Failed to connect to MySQL DB: " . mysqli_connect_error());
    }
    else {
        // Build the query
        $query = "SELECT * FROM parking WHERE
                  (
                  $LL_Lng <= StartLng AND StartLng <= $UR_Lng
                    AND $LL_Lat <= StartLat AND StartLat <= $UR_Lat
                    )
                  OR
                  (
                  $LL_Lng <= EndLng AND EndLng <= $UR_Lng
                    AND $LL_Lat <= EndLat AND EndLat <= $UR_Lat
                  )
                  ";
        // Query the DB
        if ($result = $siteContentDB->query($query)) {
            // Iterate through the results
            while ($parking = $result->fetch_object()) {
                //Push the object to the parking list
                array_push($parking_list,$parking);
            }
        }

        $siteContentDB->close();
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
        echo(json_encode($parking_list));

    }
}


function addparking($StartLng,$StartLat,$EndLng,$EndLat,$Category,$Price,
                    $Duration,$Waypoints) {

    // set the timezone reference since not setup in php.ini
    date_default_timezone_set("America/New_York");

    global $siteContentDB;
    $ID = null;

    $Waypoints = addslashes($Waypoints);
    $DateAdded = date("Y-m-d H:i:s");
    $Verified = 0;

    if(mysqli_connect_errno($siteContentDB)) {
        echo ("Failed to connect to MySQL DB: " . mysqli_connect_error());
    }
    else {
        // Build the query
        $query = "INSERT INTO parking
                  (StartLat, StartLng, EndLat, EndLng, Category, Price, Verified, DateAdded, Duration, Waypoints)
                  VALUES ($StartLat,$StartLng,$EndLat,$EndLng,
                  '$Category',$Price,$Verified,'$DateAdded',
                  $Duration,'$Waypoints')
                  ";

        // Query the DB
        if ($result = $siteContentDB->query($query)) {
            // Iterate through the results
            if ($result === TRUE) {
                //Set the ID to return
                $ID = $siteContentDB->insert_id;
            }
        }

        //echo($ID);
        $siteContentDB->close();
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
        echo(json_encode($ID));

    }
}



function deleteparking($ID) {

    // set the timezone reference since not setup in php.ini
    date_default_timezone_set("America/New_York");

    global $siteContentDB;
    $success = null;

    if(mysqli_connect_errno($siteContentDB)) {
        echo ("Failed to connect to MySQL DB: " . mysqli_connect_error());
    }
    else {
        // Build the query
        $query = "DELETE FROM parking
                  WHERE ID=$ID";

        // Query the DB
        if ($result = $siteContentDB->query($query)) {
            // Iterate through the results
            if ($result === TRUE) {
                //Set the ID to return
                $success = "Success";
            }
            else {
                $success = "Failed";
            }
        }

        //echo($ID);
        $siteContentDB->close();
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
        echo(json_encode($success));

    }
}



?>