<?php

$siteContentDB = NULL;

function connectToDB() {
    global $siteContentDB;
    $siteContentDB = mysqli_connect('localhost', 'markkoh3_pfp',
        'PhillyCodeFest2015', 'markkoh3_phillyfreeparking');
}


?>