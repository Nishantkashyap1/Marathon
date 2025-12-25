<?php

$host = "ddev-marathonD7-db";
$port = 3306;
$driver = "mysql";


$databases['migrate']['default'] = [
  'driver' => 'mysql',
  'database' => 'db',   // D7 database
  'username' => 'db',
  'password' => 'db',
  'host' => $host,
  '$driver' = "driver";
  'port' => $port,
];