document.addEventListener('DOMContentLoaded',function() {

	var beneficiariesArray; // Array
	var areasArray; // Array
	var collectorsArray; // Array
	var userLocation = {};
	var areas = {}
	var map = document.getElementById('mapid');
	var collectorSelect = document.getElementById('collectior__select');
	var areaSelect = document.getElementById('area__select');
	var addBeneficiary = document.getElementById('addBeneficiary');
	var beneficiaryform = document.getElementById('beneficiaryform');
	var customerLocation = document.getElementById('customerLocation');
	var locationData = document.getElementById('locationData');
	var saveCustomer = document.getElementById('saveCustomer');
	var cancelCustomer = document.getElementById('cancelCustomer');

	var offline = document.getElementById('offline');
	var updateLocation = document.getElementById('updateLocation');
	var mymap;
	var markerGroup;
	var locationCircle;
	var offlineMode = false;


	// UTILITIES



	// IMAGE TO BASE64
	function toDataURL(url, callback) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function() {
			var reader = new FileReader();
			reader.onloadend = function() {
				callback(reader.result);
			}
			reader.readAsDataURL(xhr.response);
		};
		xhr.open('GET', url);
		xhr.responseType = 'blob';
		xhr.send();
	}




	// Actions


	// UPDATE LOCATION BUTTON
	updateLocation.addEventListener('click',function(e) {
		e.preventDefault();
		mymap.locate({setView: true, maxZoom: 16});
		mymap.on('locationfound', onLocationFound);

	})

	// Collectors FILTER
	collectorSelect.addEventListener("change", function() {
		var value = areaSelect[areaSelect.selectedIndex].value;
	    var areaId = areaSelect[areaSelect.selectedIndex].id;
		var collectorId = collectorSelect[collectorSelect.selectedIndex].id;

		console.log(value, areaId,collectorId);
		filterData(collectorId,areaId);
	});

	areaSelect.addEventListener("change", function() {

	    var value = areaSelect[areaSelect.selectedIndex].value;
	    var areaId = areaSelect[areaSelect.selectedIndex].id;
		var collectorId = collectorSelect[collectorSelect.selectedIndex].id;

		console.log(value, areaId,collectorId);
		filterData(collectorId,areaId);
		// mymap.removeLayer(markerGroup);
		// markerGroup.clearLayers();
		// for (var i = 0; i < beneficiariesArray.length; i++) {
		// 	CreateBeneficiaries(beneficiariesArray[i],id);
		// }
		// markerGroup = L.layerGroup().addTo(mymap);
		// CreateBeneficiaries(beneficiariesArray,id);
	});

	var filterData = function (collectorId, areaID) {
		var filterbenef = [];
		var filterbenefArea = [];
		if (collectorId != "") {
			for (var i = 0; i < beneficiariesArray.length; i++) {
				if (beneficiariesArray[i].fields.Assigned.includes(collectorId) ) {
					filterbenef.push(beneficiariesArray[i])
				}
			}
		}else {
			filterbenef = beneficiariesArray ;
		}
		if (areaID != "") {
			for (var i = 0; i < filterbenef.length; i++) {
				if (filterbenef[i].fields.Area.includes(areaID) ) {
					filterbenefArea.push(filterbenef[i]);
				}
			}

		}else {
			filterbenefArea = filterbenef;
		}

		markerGroup.clearLayers();
		for (var i = 0; i < filterbenefArea.length; i++) {
			CreateBeneficiaries(filterbenefArea[i]);
		}
	};



	cancelCustomer.addEventListener('click',function(e) {
		e.preventDefault();
		map.style.display = 'block' ;
		beneficiaryform.style.display = 'none';

	})

	var newCustomer = {
		"fields": {
			"Name": "",
			"Notes": "hello",
			"picture": "",
			"housepic": "",
			"lat": 1,
			"lon": 1,
			"Assigned": [
			"recnKw4i4FFcpKYSi"
			],
			"Area": [
			"rec54htu425rjjTWZ"
			],
			"offlinepic": "",
			"Product": [
			"recQ2SRILqRXaoPwf"
			]
		}
	};

	// Add Beneficiary
	addBeneficiary.addEventListener('click',function(e) {
		e.preventDefault();
		map.style.display = 'none' ;
		beneficiaryform.style.display = 'block';

	});

	customerLocation.addEventListener('click',function(e) {
		e.preventDefault();
		navigator.geolocation.getCurrentPosition(function(position) {
			newCustomer.fields.lat = position.coords.latitude;
			newCustomer.fields.lon = position.coords.longitude;
			locationData.innerHTML = 'latitude : ' + position.coords.latitude + '<br> longitude : '+position.coords.longitude ;
		})

	});

	saveCustomer.addEventListener('click',function(e) {
		newCustomer.fields.Name = document.getElementById('name').value;
		newCustomer.fields.phone = document.getElementById('phone').value;
		resizeBase64Img(picPreview.src,100,100).then(function(newImg){
			newCustomer.fields.offlinepic = newImg;

		})
		resizeBase64Img(housePreview.src,100,100).then(function(newImg){
			newCustomer.fields.offlinepic = newImg;

		})
		// newCustomer.fields.offlinehousepic = housePreview.src;
		// newCustomer.fields.Product = []
		// newCustomer.fields.Area = []
		alert('yo');
		fetch('https://api.airtable.com/v0/appq4a0hmyrg7a7vg/Beneficiaries', {
			method: 'post',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer keyy91JVw4nn9lwqH',
			},
			body: JSON.stringify(newCustomer)
			}).then(res=>res.json())
			.then(res => {
				console.log(res);
				if (res.type ==='INVALID_VALUE_FOR_COLUMN') {
					alert('sorry data was not saved')
				}else {
					map.style.display = 'block' ;
					beneficiaryform.style.display = 'none';

				}


			}).catch(function(error) {
		        alert(error);
		    });

		});




	// SAVE beneficiaries DATA IN localStorage
	offline.addEventListener('click',function(e) {
		offline.innerText = "offline mode on";
		offlineMode = true;

		localStorage.setItem('beneficiaries', JSON.stringify(beneficiariesArray));
		console.log(JSON.parse(localStorage.beneficiaries));
		beneficiariesArray = JSON.parse(localStorage.beneficiaries);
		areasArray = JSON.parse(localStorage.areas);
		collectorsArray = JSON.parse(localStorage.collectors);

		CreateCollector(collectorsArray);
		CreateBeneficiaries(beneficiariesArray);
		CreateArea(areasArray);



	})



	//  OFFLINE MAP
	var tilesDb = {
		getItem: function (key) {
			return localforage.getItem(key);
		},

		saveTiles: function (tileUrls) {
			var self = this;

			var promises = [];

			for (var i = 0; i < tileUrls.length; i++) {
				var tileUrl = tileUrls[i];

				(function (i, tileUrl) {
					promises[i] = new Promise(function (resolve, reject) {
						var request = new XMLHttpRequest();
						request.open('GET', tileUrl.url, true);
						request.responseType = 'blob';
						request.onreadystatechange = function () {
							if (request.readyState === XMLHttpRequest.DONE) {
								if (request.status === 200) {
									resolve(self._saveTile(tileUrl.key, request.response));
								} else {
									reject({
										status: request.status,
										statusText: request.statusText
									});
								}
							}
						};
						request.send();
					});
				})(i, tileUrl);
			}

			return Promise.all(promises);
		},

		clear: function () {
			return localforage.clear();
		},

		_saveTile: function (key, value) {
			return this._removeItem(key).then(function () {
				return localforage.setItem(key, value);
			});
		},

		_removeItem: function (key) {
			return localforage.removeItem(key);
		}
	};


	// SHOW LOCATION ON MAP
	function onLocationFound(e) {
		console.log('yo location');
		if(locationCircle){
			mymap.removeLayer(locationCircle);

		}
		var radius = e.accuracy / 2;
		locationCircle = L.circle(e.latlng, radius).addTo(mymap)
			.bindPopup("You are within " + radius + " meters from this point").openPopup();
	}
	// INIT MAP
	var createMap = function () {
		mymap = L.map('mapid').setView([userLocation.lat, userLocation.lon], 13);
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFsb2V1IiwiYSI6ImNqcWc2NnY1NDR2eGk0M255OXIwbm5ndW4ifQ.TxtxZlFzMpYoAIyMWKfIfA', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			id: 'mapbox.streets'
		}).addTo(mymap);
		markerGroup = L.layerGroup().addTo(mymap);
		mymap.locate({setView: true, maxZoom: 16});
		mymap.on('locationfound', onLocationFound);
		var offlineLayer = L.tileLayer.offline('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tilesDb, {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			subdomains: 'abc',
			minZoom: 13,
			maxZoom: 19,
			crossOrigin: true
		});
		var offlineControl = L.control.offline(offlineLayer, tilesDb, {
			saveButtonHtml: '<i class="fa fa-download" aria-hidden="true"></i>',
			removeButtonHtml: '<i class="fa fa-trash" aria-hidden="true"></i>',
			confirmSavingCallback: function (nTilesToSave, continueSaveTiles) {
				if (window.confirm('Save ' + nTilesToSave + '?')) {
					continueSaveTiles();
				}
			},
			confirmRemovalCallback: function (continueRemoveTiles) {
				if (window.confirm('Remove all the tiles?')) {
					continueRemoveTiles();
				}
			},
			minZoom: 13,
			maxZoom: 19
		});

		offlineLayer.addTo(mymap);
		offlineControl.addTo(mymap);

		offlineLayer.on('offline:below-min-zoom-error', function () {
			alert('Can not save tiles below minimum zoom level.');
		});

		offlineLayer.on('offline:save-start', function (data) {
			console.log('Saving ' + data.nTilesToSave + ' tiles.');
		});

		offlineLayer.on('offline:save-end', function () {
			alert('All the tiles were saved.');
		});

		offlineLayer.on('offline:save-error', function (err) {
			console.error('Error when saving tiles: ' + err);
		});

		offlineLayer.on('offline:remove-start', function () {
			console.log('Removing tiles.');
		});

		offlineLayer.on('offline:remove-end', function () {
			alert('All the tiles were removed.');
		});

		offlineLayer.on('offline:remove-error', function (err) {
			console.error('Error when removing tiles: ' + err);
		});


	}






// INCREMENT SELECT Collectors
var CreateCollector = function(collector) {
	console.log(collector.fields.Name);
	this.option = document.createElement('option');
	this.option.value = collector.fields.Name;
	this.option.innerText = collector.fields.Name;
	this.option.id = collector.id;
	collectorSelect.appendChild(this.option);

}
// INCREMENT SELECT AREA
var CreateArea = function(collector) {
	console.log(collector.fields.Name);
	this.option = document.createElement('option');
	this.option.value = collector.fields.Name;
	this.option.innerText = collector.fields.Name;
	this.option.id = collector.id;
	areaSelect.appendChild(this.option);

}
// ADD MAP PIN.
var CreateBeneficiaries = function(beneficiary,collectorId,area) {
		console.log(beneficiary.fields.lat, beneficiary.fields.lon);
		var marker = L.marker([beneficiary.fields.lat, beneficiary.fields.lon]).addTo(markerGroup).bindPopup("name " + beneficiary.fields.Name + "<br><br> <a href='geo:0,0?q="+beneficiary.fields.lat+""+beneficiary.fields.lon+"'>open in mapsme</a>");

};

//  FETCH DATA FROM AIRTABLE
fetchCollectors = () =>{
	console.log('load');
	let url = `https://api.airtable.com/v0/appq4a0hmyrg7a7vg/Collectors?view=Grid%20view`


	fetch(url,{
	   method: 'get',
	   headers: new Headers({
		 'Authorization': 'Bearer keyy91JVw4nn9lwqH',
	}),
	})
	.then((response) => response.json())
	.then((collectors) => {
		console.log(collectors.records);
		localStorage.setItem('collectors', JSON.stringify(collectors.records));
		for (var i = 0; i < collectors.records.length; i++) {
			CreateCollector(collectors.records[i]);
		}
	})
	.catch((error) => {
		console.error(error);
	});

}

fetchBeneficiares = () =>{
	console.log('load');
	let url = `https://api.airtable.com/v0/appq4a0hmyrg7a7vg/Beneficiaries?view=All`


	fetch(url,{
	   method: 'get',
	   headers: new Headers({
		 'Authorization': 'Bearer keyy91JVw4nn9lwqH',
	}),
	})
	.then((response) => response.json())
	.then((beneficiaries) => {
		console.log(beneficiaries.records)
		beneficiariesArray = beneficiaries.records;
		localStorage.setItem('beneficiaries', JSON.stringify(beneficiariesArray));
		console.log(beneficiariesArray);
		for (var i = 0; i < beneficiaries.records.length; i++) {
			CreateBeneficiaries(beneficiaries.records[i]);
		}
	})
	.catch((error) => {
		console.error(error);
	});

}

fetchArea = () =>{
	console.log('load');
	let url = `https://api.airtable.com/v0/appq4a0hmyrg7a7vg/Area?view=Grid%20view`


	fetch(url,{
	   method: 'get',
	   headers: new Headers({
		 'Authorization': 'Bearer keyy91JVw4nn9lwqH',
	}),
	})
	.then((response) => response.json())
	.then((areas) => {
		console.log(areas.records)
		localStorage.setItem('areas', JSON.stringify(areas.records));
		for (var i = 0; i < areas.records.length; i++) {
			CreateArea(areas.records[i]);
		}
	})
	.catch((error) => {
		console.error(error);
	});

}


// navigator.geolocation.getCurrentPosition(function(position) {
//  		console.log(position.coords.latitude, position.coords.longitude);
// });



	// fetchCollectors(function(response) {
	// 	// console.log(response);
	// 	// response.beneficiaries.map (beneficiary)=> {
	// 	//
	// 	// }
	// })
	//
	// fetchBeneficiares(function(response) {
	// 	//  console.log(response);
	// })
	// fetchArea();



	//  INIT APP AFTER GEOLOCATION GRANTED
	navigator.geolocation.getCurrentPosition(function(position) {
		console.log(position.coords.latitude, position.coords.longitude);
		userLocation.lat = position.coords.latitude;
		userLocation.lon = position.coords.longitude;
		createMap();
		fetchCollectors();
		fetchArea();
		fetchBeneficiares();


	});





});
