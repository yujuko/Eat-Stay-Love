var app = angular.module('angularjsNodejsTutorial', []);

var cities;
var citiesArr = [];
var topCitiesArr = [];
var hotelsArr = [];
var restaurantsArr = [];
	// $scope.showRange = false;
	// $scope.showHotels = false;
	// $scope.showRestaurants = false;


// Controller for the Cities
app.controller('citiesController', function($scope, $http) {
	$scope.showAttractions = false;

	$http({
		url: '/topCities',
		method: 'GET'
	}).then(res => {
		cities = res.data.rows;
		for(var i = 0; i < cities.length ; i++){
			topCitiesArr.push({city: cities[i][0],
						state:cities[i][1],
						num_hotel:cities[i][2],
						avg_hotel_rating:cities[i][3].toFixed(2),
						num_restaurant: cities[i][4],
						avg_restaurant_rating:cities[i][5].toFixed(2),
						hotel_name: cities[i][6],
						category: cities[i][7],
						num_reviews: cities[i][8],
						rating: cities[i][9].toFixed(2),
						img: cities[i][10],
						})
			
		}
		var seen = new Set();
		var checkedCities = [];
			for(var k = 0 ; k < topCitiesArr.length ; k++){
				if(!seen.has(topCitiesArr[k].city+ topCitiesArr[k].state)){
					checkedCities.push(topCitiesArr[k]);
					seen.add(topCitiesArr[k].city+ topCitiesArr[k].state);
				}
			}
		console.log("TOPCITIES: ", topCitiesArr);
		$scope.topCities = checkedCities;
	}, err => {
		console.log("GET CITIES ERROR: ", err);
	});

  var fiveStarsRestaurantsArr =[];
  $http({
    url: '/fiveStarsRestaurants',
    method: 'GET'
  }).then(res => {
    restaurants = res.data.rows[0];
      fiveStarsRestaurants = {
            restaurant_name: restaurants[0],
            city_name: ", " + restaurants[1],
            rating: restaurants[2] + " Star Rating",
            numEliteReviews:restaurants[4] + " Elite Reviews",
            img : "https://s3-media2.fl.yelpcdn.com/bphoto/" + restaurants[3] + "/o.jpg",
            }
    
    console.log("fiveStarsRestaurants: ", fiveStarsRestaurants);
    console.log(restaurants);
    $scope.fiveStarsRestaurants = fiveStarsRestaurants;
  }, err => {
    console.log("GET fiveStarsRestaurants ERROR: ", err);
  });

	$http({
		url: '/city',
		method: 'GET'
	}).then(res => {
		cities = res.data.rows;
		for(var i = 0; i < cities.length ; i++){
			citiesArr.push({city: cities[i][0],
				state:cities[i][1]})
		}
		console.log("CITIES: ", citiesArr);
		$scope.cities = citiesArr;
	}, err => {
		console.log("GET CITIES ERROR: ", err);
	});
	$scope.submitCity = function() {
		$scope.showAttractions = true;
	// console.log("SELECTED "+ $scope.selectedCity);
	var cityState = $scope.selectedCity
	var parse = cityState.split(',');
	var city = parse[0];
	var state = parse[1].trim();
	localStorage.setItem('User-city', city);
	localStorage.setItem('User-state',state);
	console.log("CITY: "+city);
	console.log("STATE: "+state);

	/* ---------- Attractions (Foursquare) ---------- */
	$http({
		url: 'https://api.foursquare.com/v2/venues/explore?near='+cityState+'&section=outdoors&client_id=PEMDNAG2WAY1AMMYMFOI3PGJLXBAGWQOBELSGHBCGZRW5UJH&client_secret=4U25IKFK1IWNXBAG0QOCR0UP2G54LECJWAOIM3JBT54DBXDH&v=20180303',
		method: 'GET'
	}).then(res => {
		console.log("ATTRACTIONS: ", res.data.response.groups[0].items);
		$scope.attractions = res.data.response.groups[0].items;


		attractionsArr = []

		$scope.attractions.forEach(function(atr){
			console.log(atr.venue.location.name);
			name = atr.venue.name;
			lat = atr.venue.location.lat;
			lng = atr.venue.location.lng;

			attraction = [];
			attraction.name = name;
			attraction.lat = lat;
			attraction.lng = lng;
			attraction.type = "attraction";

			attractionsArr.push(attraction);

		})

		console.log(attractionsArr);

		//Display Google Map
		if (attractionsArr.length > 0){
			var locations = Array.from(attractionsArr);
			initMap(locations);
		}
		else {
			console.log("NO DATA");
		}
		//Display Google Map Ends

	}, err => {
		console.log("ATTRACTIONS ERROR: ", err);
	});

}
var selectedAttractionsArr = [];
$scope.selectedList = {};
$scope.submitAttractions = function() {
	$scope.showRange = true;
	for(var i = 0; i < $scope.attractions.length ; i++){
		if($scope.attractions[i].selected == true){
			var selected = $scope.attractions[i].venue;
			selectedAttractionsArr.push({
        id : selected.id, 
        name : selected.name, 
        address : selected.location.formattedAddress[0], 
        lat :selected.location.lat, 
        lng: selected.location.lng  });
		}
	}
	localStorage.setItem('User-Attractions', JSON.stringify(selectedAttractionsArr));
}
});


/* ---------- Hotels (Marriott) ---------- */
app.controller('hotelsController', function($scope, $http) {
	$scope.submitRange = function(){
		var selectedAttractionsArr = JSON.parse(localStorage.getItem("User-Attractions") || "[]");
		var state = localStorage.getItem("User-state");
		var range = $scope.selectedRange;
		var rating = $scope.selectedRating;
		var category = $scope.selectedCategory;
		$scope.showHotels = true;
		$http({
			url: '/hotel/'+ state + '/' + rating + '/' + category,
			method: 'GET'
		}).then(res => {
			hotelsArr = [];
			hotels = [];
			console.log(res.data.rows);
			hotels = res.data.rows;
			for(var i = 0; i < hotels.length ; i++){
				var h_name = hotels[i][0]
				var h_city = hotels[i][1]
				var h_latitude = hotels[i][2]
				var h_longitude = hotels[i][3]
				var h_rating = Math.round( hotels[i][4] * 10 ) / 10
				var h_category = hotels[i][5]
				var h_img = hotels[i][6]
		        var h_address = hotels[i][7]
		        var h_zipcode = hotels[i][8]

				var coords1 = [];
				coords1[0] = h_latitude;
				coords1[1] = h_longitude;

				for(var j = 0; j < selectedAttractionsArr.length ; j++){
					var coords2 = [];
					coords2[0] = selectedAttractionsArr[j].lat;
					coords2[1] = selectedAttractionsArr[j].lng;
					if(checkProximity(coords1, coords2, range)){
						hotelsArr.push({
							name: h_name,
							rating:h_rating,
							category:h_category,
							img: h_img,
							lat: h_latitude,
							lng: h_longitude,
              				address: h_address,
              				zipcode: h_zipcode,
							type: "hotel"
						})
					}
				}        
			}
			var seen = new Set();
			var checkedHotel = [];
			for(var k = 0 ; k < hotelsArr.length ; k++){
				if(!seen.has(hotelsArr[k].name)){
					checkedHotel.push(hotelsArr[k]);
					seen.add(hotelsArr[k].name);
				}
			}

			//Display Google Map
			if (checkedHotel.length > 0){
				var locations = Array.from(checkedHotel);
				initMap(locations);
			}
			else {
				console.log("NO DATA");
			}
			//Display Google Map Ends

			console.log("HOTELS: ", checkedHotel);
			$scope.hotels = checkedHotel;
		}, err => {
			console.log("GET HOTELS ERROR: ", err);
		});
	}

	var selectedHotel;

	$scope.submitHotels = function(hotel){
		$scope.showRating = true;
		for(var i = 0; i < $scope.hotels.length ; i++){
			if($scope.hotels[i].selected == true)
				selectedHotel = $scope.hotels[i];
			localStorage.setItem('User-Hotels', JSON.stringify(selectedHotel));
		}
	}
	
});

/* ---------- Restaurants (Yelp) ---------- */
app.controller('restaurantsController', function($scope, $http) {
	//Cuisine Start
	var city = localStorage.getItem('User-city');
	var state = localStorage.getItem('User-state');
	var cuisineArr = [];
	$http({
	url: '/cuisine/'+ city + '/' + state,
	method: 'GET'
	}).then(res => {
	cuisine = res.data.rows;
	cuisineArr.push({
		cuisine : 'No Preference',
		num : 0
	})

	for(var i = 0; i < cuisine.length ; i++){
	  cuisineArr.push({
	    cuisine: cuisine[i][0],
	    num : cuisine[i][1]
	  })
	}
	console.log("Cuisine: ", cuisineArr);
	$scope.cuisine = cuisineArr;

	}, err => {
	console.log("GET CITIES ERROR: ", err);
	});
	//Cuisine End

	$scope.showTopRestaurants = function(){
		$scope.showRestaurants = false;
		var city = localStorage.getItem('User-city');
		var state = localStorage.getItem('User-state');
		$http({
			url: '/topRestaurants/'+ city + '/'+ state,
			method: 'GET'
		}).then(res => {
			$scope.showTop = true;
			topRestaurants = res.data.rows;
			topRestaurantsArr = [];
			for(var i = 0; i < topRestaurants.length ; i++){
				topRestaurantsArr.push({
					name: topRestaurants[i][1],
					elite_stars:topRestaurants[i][3],
					review_text:topRestaurants[i][4],
					review_date:topRestaurants[i][5],
					reviewer:topRestaurants[i][6],
					reviewer_stars:topRestaurants[i][7],         
					img : "https://s3-media2.fl.yelpcdn.com/bphoto/" + topRestaurants[i][8] + "/o.jpg",
					address: topRestaurants[i][9],         
					zipcode: topRestaurants[i][10],         
					lat: topRestaurants[i][11],         
					lng: topRestaurants[i][12],
					type: "restaurant"         
				})
			}

			//Display Google Map
			if (topRestaurantsArr.length > 0){
				var locations = Array.from(topRestaurantsArr);
				var selectedHotel = JSON.parse(localStorage.getItem("User-Hotels"));
				locations.push(selectedHotel);
				initMap(locations);
			}
			else {
				console.log("NO DATA");
			}
			//Display Google Map Ends

			$scope.topRestaurants = topRestaurantsArr;

		}, err => {
		 console.log("GET TOP RESTAURANTS ERROR: ", err);
	 });
	}

	$scope.submitRating = function(){
		$scope.showTop = false;
		var selectedHotel = JSON.parse(localStorage.getItem("User-Hotels"));
		var state = localStorage.getItem('User-state');
		var rating = $scope.selectedRating;
	    var range = $scope.selectedRange;
	    var cuisine = $scope.selectedCuisine;
		var coords1 = [];
		coords1[0] = selectedHotel.lat;
		coords1[1] = selectedHotel.lng;

		$http({
			url: '/restaurant/'+state+ '/'+ rating+ '/' + cuisine,
			method: 'GET'
		}).then(res => {
			restaurantsArr =[];
			restaurants = res.data.rows;
			for(var i = 0; i < restaurants.length ; i++){
				var r_id = restaurants[i][0]
				var r_name = restaurants[i][1]
				var r_stars = restaurants[i][2]
				var r_reviewCount = restaurants[i][3]
				var r_lat = restaurants[i][4];
				var r_lng = restaurants[i][5];
				var r_address = restaurants[i][6];
				var r_categories = restaurants[i][7];
				var r_img = "https://s3-media2.fl.yelpcdn.com/bphoto/" + restaurants[i][8] + "/o.jpg"
        		var r_zipcode = restaurants[i][9];

				var coords2 = [];
				coords2[0] = r_lat;
				coords2[1] = r_lng;

				if(checkProximity(coords1, coords2, range)){
					restaurantsArr.push({
						name:r_name,
						stars:r_stars,
						review_count: r_reviewCount,
						img: r_img,
						address: r_address,
						categories : r_categories,
						lat : r_lat,
						lng : r_lng,
						type : "restaurant",
            			zipcode : r_zipcode,
					})
				}
			}
			var seen = new Set();
			var checkedR = [];
			for(var k = 0 ; k < restaurantsArr.length ; k++){
				if(!seen.has(restaurantsArr[k].name)){
					checkedR.push(restaurantsArr[k]);
					seen.add(restaurantsArr[k].name);
				}
			}

			//Display Google Map
			if (checkedR.length > 0){
				var locations = Array.from(checkedR);
				locations.push(selectedHotel);
				initMap(locations);
				$scope.showRestaurants = true;
			}
			else {
				console.log("NO DATA");
			}
			//Display Google Map Ends

			console.log("RESTAURANTS: ", checkedR);
			$scope.restaurants = checkedR;
		}, err => {
		 console.log("GET RESTAURANTS ERROR: ", err);
	 });
	}

  $scope.submitTopRestaurants = function(){
      var selectedRestaurantArr = [];
      $scope.selectedList = {};
      if($scope.topRestaurants){
	      for(var i = 0; i < $scope.topRestaurants.length ; i++){
	        if($scope.topRestaurants[i].selected == true){
	          var selected = $scope.topRestaurants[i];
	          selectedRestaurantArr.push({
	            name:selected.name,
	            stars:selected.elite_stars,
	            review_text: selected.review_text,
	            reviewer:selected.reviewer,
	            reviewer_stars:selected.reviewer_stars,
	            img: selected.img,
	            address : selected.address,
	            zipcode: selected.zipcode,
	            lat : selected.lat,
	            lng : selected.lng,
				type : "restaurant"
	          });
	        }
	      }
      }
      localStorage.setItem('User-TopRestaurants', JSON.stringify(selectedRestaurantArr));
      
  }

  $scope.submitRestaurants = function(){
      var selectedRestaurantArr = [];
      $scope.selectedList = {};
      if($scope.restaurants){
	      for(var i = 0; i < $scope.restaurants.length ; i++){
	        if($scope.restaurants[i].selected == true){
	          var selected = $scope.restaurants[i];
	          selectedRestaurantArr.push({
	            name:selected.name,
	            stars:selected.stars,
	            review_count: selected.reviewCount,
	            img: selected.img,
	            address: selected.address,
	            categories : selected.categories,
	            lat : selected.lat,
	            lng : selected.lng,
	            zipcode : selected.zipcode,
				type : selected.type,
	          });
	        }
	      }
      }	
      localStorage.setItem('User-Restaurants', JSON.stringify(selectedRestaurantArr));     
  }

});

/* ---------- Summary Controller ---------- */
app.controller('summaryController', function($scope, $http) {
  $scope.city = localStorage.getItem('User-city');
	var topRestaurants = JSON.parse(localStorage.getItem('User-TopRestaurants'));
	$scope.topRestaurants = topRestaurants;

	var restaurants = JSON.parse(localStorage.getItem('User-Restaurants'));
	$scope.restaurants = restaurants;

	var hotel = JSON.parse(localStorage.getItem('User-Hotels'));
	$scope.hotel = hotel;

	var attractions = JSON.parse(localStorage.getItem('User-Attractions'));
	$scope.attractions = attractions;

  	//Display Google Map
  	console.log("Summary Controller Items:");
  	console.log(hotel);
  	console.log(topRestaurants);
  	console.log(restaurants);
	var locations = Array.from(attractions);
	locations.push(hotel);
	for(var i = 0 ; i < topRestaurants.length ; i++){
		locations.push(topRestaurants[i]);
	}
	for(var i = 0 ; i < restaurants.length ; i++){
		locations.push(restaurants[i]);
	}
	console.log("Rendering Summary Map");
	initMap(locations);
	//Display Google Map Ends


});

/* HELPER FUNCTIONS */


//Method takes in 2 pairs of coordinates (lat,lon), check if within range(mi)
function checkProximity(coords1, coords2, range){
 var distance = getHaversineDistance(coords1, coords2);
 if (distance <= range) return true;
 return false;
}


//Method takes in two pairs of coordinates and returns distance in miles 
// Note:Distance calculation formula using Haversine
function getHaversineDistance(coords1, coords2) {
	function toRad(x) {return x * Math.PI / 180;}

	var lat1 = coords1[0]
	var lon1 = coords1[1]

	var lat2 = coords2[0]
	var lon2 = coords2[1]

	var radius = 6372.8; // earth radius in km
	var latDiff = toRad(lat2 - lat1);
	var lonDiff = toRad(lon2 - lon1);
	lat1 = toRad(lat1);
	lat2 = toRad(lat2);

	var a = Math.pow(Math.sin(latDiff / 2), 2) + Math.pow(Math.sin(lonDiff / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
	var c = 2 * Math.asin(Math.sqrt(a));
	var distanceKM = radius * c;
	var distanceMiles = Math.round(distanceKM * 0.62137 * 100.0) / 100.0; //return distance in mi with 2 decimal precision

	return distanceMiles;
}


//Method takes in an array of locations and plots them on the Google Map
function initMap(locations) {

	var defaultLocation = {lat: 40.732845, lng: -73.995459};

	console.log("initMap():");
	console.log(locations);

	var map = new google.maps.Map(document.getElementById('googleMap'), {
		zoom: 12,
		center: defaultLocation
	});

	var infowindow = new google.maps.InfoWindow({})

	var marker, i
	var markers = []; //to store all markers

	if (locations != undefined){
		for (i = 0; i < locations.length; i++) {
			if (locations[i].type == "attraction"){
				image = {
					url: "/../assets/icons/postal-code-modified.png",
					size: new google.maps.Size(71, 71),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(17, 34),
					scaledSize: new google.maps.Size(30, 30)
				};

			}
			else if (locations[i].type == "hotel"){
				image = {
					url: "/../assets/icons/marriott-bonvoy.png",
					size: new google.maps.Size(71, 71),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(17, 34),
					scaledSize: new google.maps.Size(30, 30)
				};
			}
			else if (locations[i].type == "restaurant") {
				image = {
					url: "/../assets/icons/restaurant-icon-1.png",
					size: new google.maps.Size(71, 71),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(17, 34),
					scaledSize: new google.maps.Size(40, 40)
				};
			}
			else {
				image = {
					url: "/../assets/icons/map-pin.svg",
					size: new google.maps.Size(71, 71),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(17, 34),
					scaledSize: new google.maps.Size(25, 25)
				};
			}

			marker = new google.maps.Marker({
				position: new google.maps.LatLng(locations[i].lat, locations[i].lng),
				map: map,
				center: defaultLocation,
				icon: image,
				title: locations[i].name
			})
			markers.push(marker);

			google.maps.event.addListener(
				marker,
				'click',
				(function(marker, i) {
					return function() {
						infowindow.setContent(locations[i].name)
						infowindow.open(map, marker)
					}
				})(marker, i)
				)
		}

		// To set default zoom to cover all markers
		var bounds = new google.maps.LatLngBounds();
		for (var i = 0; i < markers.length; i++) {
			bounds.extend(markers[i].getPosition());
	 	}
	 	map.fitBounds(bounds);
	}
}
