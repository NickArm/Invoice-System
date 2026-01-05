<?php
require 'vendor/autoload.php';

$reflection = new ReflectionClass('Webklex\PHPIMAP\Attachment');
$methods = $reflection->getMethods();

echo "Attachment methods:\n";
foreach ($methods as $method) {
    if (!str_starts_with($method->name, '__')) {
        echo "- " . $method->name . "\n";
    }
}

// Also check properties
echo "\nProperties:\n";
foreach ($reflection->getProperties() as $prop) {
    echo "- " . $prop->name . "\n";
}
