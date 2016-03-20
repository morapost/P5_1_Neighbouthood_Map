//Global variables
var marker;
var map;
var myLatLng;
var infowindow;
var infowindowContent;

//Model array with hard-coded locations
var arrayLocations = [{
    title: "Lal Bagh",
    lat: 12.9500,
    lng: 77.5900,
    address: "Bengaluru, Karnataka 560004"

}, {
    title: "Cubbon Park",
    lat: 12.9700,
    lng: 77.6000,
    address: "Kasturba Road, Sampangi Rama Nagar, Bengaluru, Karnataka 560001"

}, {
    title: "Tipu Sultan's Summer Palace",
    lat: 12.9595,
    lng: 77.5736,
    address: "Allbert Victor Road, Chamrajpet, Bengaluru, Karnataka 560018"

}, {
    title: "Bangalore Palace",
    lat: 12.9985,
    lng: 77.5921,
    address: "Palace Rd, Vasanth Nagar, Bengaluru, Karnataka 560052"

}, {
    title: "ISKCON Temple Bangalore",
    lat: 13.0094,
    lng: 77.5508,
    address: "Hare Krishna Hill,, Chord Road, Rajaji Nagar, Bengaluru, Karnataka 560010"

}];



function initMap() {


    // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 12.9667,
            lng: 77.5667
        },
        zoom: 12
    });

    // Create a marker and set its position.
    for (var i = 0; i < arrayLocations.length; i++) {
        var loc = arrayLocations[i];
        myLatLng = new google.maps.LatLng(loc.lat, loc.lng);
        marker = new google.maps.Marker({
            animation: google.maps.Animation.DROP,
            map: map,
            position: myLatLng
        });
        marker.setMap(map);
        loc.marker = marker;

        marker.addListener('click', toggleBounce);

        //create info windows
        infowindow = new google.maps.InfoWindow();
        loc.infowindow = infowindow;

        //To hide marker when it's visibility changes.
        marker.addListener('visible_changed', function() {
            infowindow.close(map, marker);
        });
        // Display wiki info window when the marker is clicked
        google.maps.event.addListener(marker, 'click', function() {
            infoWiki(this);
        });

    }
    ko.applyBindings(new ViewModel());
}

function infoWiki(clickPosition) {
    //gets lat and long of the clicked marker
    myLatLng = clickPosition.getPosition();

    for (var i = 0; i < arrayLocations.length; i++) {


        var title = arrayLocations[i].title;
        var address = arrayLocations[i].address;
        var url = "https://en.wikipedia.org/w/api.php?action=opensearch&search=" + title + "&format=json&callback=wikiCallback"
            //sends request to Wikipedia
        $.ajax({
            url: url,
            type: "POST",
            dataType: "jsonp",

            //displays Wikipedia  in infowindow
            success: function(response) {
                var Description = response[2][0];
                infowindowContent = "<h3>" + title + "</h3>" + "<h4>" + address + "</h4>" + "<h5>" + Description + "</h5>" + "<a href='https://en.wikipedia.org/wiki/" + title + "'>Link to Wikipedia Page</a>";
                createInfoWindow(clickPosition);
                clearTimeout(wikiFail);
            }
        });
        //error handler for Wikipedia
        var wikiFail = setTimeout(function() {
            infowindowContent = "Unable to connect to Wikipedia";
            createInfoWindow(clickPosition);
        }, 8000);
        //}
    }
}

function createInfoWindow(clickPosition) {
    infowindow.setContent(infowindowContent);
    infowindow.open(map, clickPosition);
}

function toggleBounce() {
    var self = this;
    if (this.getAnimation() !== null) {
        this.setAnimation(null);
    } else {
        this.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            self.setAnimation(null)
        }, 1000);
    }
};
// Alert the user if google maps isn't working
function googleError() {
    "use strict";
    document.getElementById('map').innerHTML = "<h2>Google Maps is not loading. Please try refreshing the page later.</h2>";
};

//constructor for KO location object

var Storage = function(data) {
    this.title = ko.observable(data.title);
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
    this.address = ko.observable(data.address);
}

var ViewModel = function() {
    var self = this;

    //creates KO array for the initial locations array 
    self.locationList = ko.observableArray([]);

    //pushes the initial locations into the location list array as new Location objects
    arrayLocations.forEach(function(locationItem) {
        self.locationList.push(new Storage(locationItem));
    });

    //sets the current location to the first location in the locationList array
    self.currentLocation = ko.observable(self.locationList()[0]);

    //sets the current location to the location clicked and binds markers to location click
    self.toggleMarker = function(listMarker) {
        self.currentLocation(listMarker);
        google.maps.event.trigger(listMarker.marker, 'click');
    };

    //stores initial Locations for search
    self.places = ko.observableArray(arrayLocations);

    //retreiving input string for filter
    self.filter = ko.observable("");

    //searches through locations and displays searched marker
    self.search = ko.computed(function() {
        return ko.utils.arrayFilter(self.places(), function(place) {
            // checking if lower case version of location is indexOf filter
            if (place.title.toLowerCase().indexOf(self.filter().toLowerCase()) >= 0) {
                place.marker.setVisible(true);
                return true;
            } else {
                place.marker.setVisible(false);
                return false;
            }
        });
    });

};