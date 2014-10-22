Marker Flocks
============

![Alt](https://stevefar.com/marker-flock/favicon.png "Example Flock")

See [the demo](https://stevefar.com/marker-flock/).

## Requirements
* [Leaflet](http://leafletjs.com/)
* [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)

## Dynamic Markers
Marker Flocks utilizes HTML5 canvas to build markers on the fly rather than loading individual images. This will save you bandwidth and allow you to easilly customize your markers.

~~~~
// Create a Single Marker
var marker = MarkerFlock({color: ["#fdebb3", "#ffc511"]});

// Set global marker scale
MarkerFlock.setScale("large");

// Set global hover state
MarkerFlock.setHoverOptions({
 color: ["#54B633", "#45632e"]
});

// Export the icon
document.body.append(marker.image());
document.body.append(marker.image_shadow());
document.body.append(marker.canvas());
document.body.append(marker.svg());

~~~~

## Flocks
Marker Flocks uses the MarkerCluster plugin to load thousands of map markers, but instead of hiding your markers, it combines nearby map markers into close-knit flocks to preserve the appearence of volume.

~~~~
// Create your map
var map = L.map('map').setView([41.55, -72.65], 13);

// Create a marker cluster
var markerCluster = L.markerClusterGroup({
 maxClusterRadius: 8,
 showCoverageOnHover: false,
 iconCreateFunction: MarkerFlock.iconCreateFunction
});

// Create some markers
var marker = new MarkerFlock({
 color: ["#54B633", "#45632e"]
}).leafletMarker([41.55, -72.65]);

// Add it to the Marker Cluster
markerCluster.addLayer(marker);

...

// Add the Marker Cluster to the map
map.addLayer(markerCluster);
~~~~
