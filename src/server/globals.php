<?php

$siteContentDB = NULL;

function connectToDB() {
    global $siteContentDB;
    //$siteContentDB = mysqli_connect('localhost', 'markkoh3_pfp', 'PhillyCodeFest2015', 'markkoh3_phillyfreeparking');
    // Use this for a localserver not on the website
    $siteContentDB = mysqli_connect('localhost', 'root', '', 'DevPhillyFreePark');
}


?>