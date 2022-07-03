var indiaGeojsonObject = '';
var geojsonObject = '';
var cameraGeojsonObject = '';
var IndiaExtents = null;
var telanganaStateExtents = null;
var cameraSpeciesStatistics = [];
var cameraSpeciesStatisticsData = null;
var cameraImagesQueued = false;

const initMap = () => {
    var attribution = new ol.control.Attribution({
        collapsible: false
    });
    mapview = new ol.View({
        center: ol.proj.fromLonLat([81.0095998, 22.3052918]),
        maxZoom: 18,
        zoom: 4.5,
    });
    map = new ol.Map({
        controls: [],
        interactions: ol.interaction.defaults({
            doubleClickZoom: true,
            dragAndDrop: true,
            dragPan: true,
            keyboardPan: true,
            keyboardZoom: true,
            mouseWheelZoom: true,
            pointer: true,
            select: true
        }),
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                  url: 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}'
                })
              })
        ],
        target: 'map',
        view: mapview
    });
    map.on("click", function(e) {
        map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
            //console.log(feature.get('name'));
            //getStateStatistics(feature.get('name'));
        })
    });
    getIndiaBasemap();
    //getTelanganaBoundary();
    initializeStatisticsCheckBox();
    imageModalActionsCorrection();
    getDefaultLastWeekStatistics();
    
    //changeInteraction();
}


let select = null; 


/* new ol.style.Style({
    image: new ol.style.Icon({
        anchor: [0.5, 46],
        //size: [30, 30],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        rotation: item.sp_rotation,
        src: '../icons/camera_trap.png'
    }),
}) */



function selectStyle(feature) {
    const color = feature.get('COLOR') || '#eeeeee';

    var selected = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({color: 'black'}),
          stroke: new ol.style.Stroke({
            color: [255,0,0], width: 2
          })
        })
      })


    /* const selected = new ol.style.Style({
        fill: new ol.style.Fill({
          color: '#00FF00',
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 255, 0, 0.7)',
          width: 2,
        }),
      }); */



    selected.getFill().setColor(color);
    return selected;
  }

  


const changeInteraction = function () {
    if (select !== null) {
      map.removeInteraction(select);
    }
    const selectSingleClick = new ol.interaction.Select({style: selectStyle});
    select = selectSingleClick;
    if (select !== null) {
      map.addInteraction(selectSingleClick);
    }
  };




const getIndiaBasemap = () => {
    fetch(getIndiaBasemapURL,
    {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        indiaGeojsonObject = {
            'type': 'FeatureCollection',
            'crs': {
            'type': 'name',
            'properties': {
                'name': 'EPSG:3857',
            },
            },
            'features': []
        }
        data.data.forEach((item) => {
            var geometry = JSON.parse(item.sp_geometry);
            var name = item.sp_state_name;
            console.log("Style: " + geometry.type);
            indiaGeojsonObject.features.push({
                'type': 'Feature',
                'geometry': geometry,
                'properties': {name}
            });

            const vectorSource = new ol.source.Vector({
                features: new ol.format.GeoJSON().readFeatures(indiaGeojsonObject)
            }); 
        
            const vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                name: 'IndiaBoundary',
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 1,
                    }),
                    fill: new ol.style.Fill({
                    //color: 'rgba(3, 145, 255, 0.7)',
                    color: 'rgb(253, 222, 163, 0.7)'
                    }),
                })
            });
            map.getLayers().forEach(function (layer) {
                if(layer.get('name') == "IndiaBoundary") {
                    map.removeLayer(layer);
                }
            });
            map.addLayer(vectorLayer);
            IndiaExtents = vectorSource.getExtent();
            //map.getView().fit(IndiaExtents);
        })
        getTelanganaBoundary();
    })
}

const getTelanganaBoundary = () => {
    fetch(getTelanganaBoundaryURL,
    {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        geojsonObject = {
            'type': 'FeatureCollection',
            'crs': {
            'type': 'name',
            'properties': {
                'name': 'EPSG:3857',
            },
            },
            'features': []
        }
        data.data.forEach((item) => {
            var geometry = JSON.parse(item.sp_geometry);
            var name = item.sp_state_name;
            console.log("Style: " + geometry.type);
            geojsonObject.features.push({
                'type': 'Feature',
                'geometry': geometry,
                'properties': {name}
            });

            const vectorSource = new ol.source.Vector({
                features: new ol.format.GeoJSON().readFeatures(geojsonObject)
            }); 
        
            const vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                name: 'telanganaStateBoundary',
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 1,
                    }),
                    fill: new ol.style.Fill({
                    //color: 'rgba(3, 145, 255, 0.7)',
                    color: 'rgb(40, 170, 141, 0.4)'
                    }),
                })
            });
            map.getLayers().forEach(function (layer) {
                if(layer.get('name') == "telanganaStateBoundary") {
                    map.removeLayer(layer);
                }
            });
            map.addLayer(vectorLayer);
            telanganaStateExtents = vectorSource.getExtent();
            map.getView().fit(telanganaStateExtents);
        })
        getDefaultLastWeekCameraTrapLocations();
    })
}

const getDefaultLastWeekStatistics = () => {
    fetch(getDefaultLastWeekStatisticsURL,
    {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        var totalSightings = 0;
        data.data.forEach((item)=> {
            totalSightings += parseInt(item.sp_count);
        })
        var humanSightings = parseInt(data.data.filter((x) => x.sp_species == 'Humans')[0].sp_count);
        var falseTriggerFilter = data.data.filter((x) => x.sp_species == 'Unknown');
        var falseTriggers;
        if(falseTriggerFilter.length)
            falseTriggers = parseInt(falseTriggerFilter[0].sp_count);
        humanInterferencePercentage = (humanSightings/totalSightings) * 100;
        falseTriggersPercentage = (falseTriggers/totalSightings) * 100;

        $("#rightDashboardTotalSightingsDiv").show();
        $("#rightDashboardTotalSightingsDiv").empty();
        $("#rightDashboardTotalSightingsDiv").append("<h5 class='totalsightings-label'>Last 7 days sightings</h5>");
        $("#rightDashboardTotalSightingsDiv").append("<h1 class='totalsightings-count'>" + totalSightings + "</h1>");

        $("#rightDashboardTotalHumanInterferencePercentageDiv").show();
        $("#rightDashboardTotalHumanInterferencePercentageDiv").empty();
        $("#rightDashboardTotalHumanInterferencePercentageDiv").append("<h5 class='totalsightings-label'>Human interference percentage</h5>");
        $("#rightDashboardTotalHumanInterferencePercentageDiv").append("<h1 class='totalsightings-count'>" + humanInterferencePercentage.toFixed(2) + "%</h1>");

        if(falseTriggerFilter.length) {
            $("#rightDashboardFalseTriggersPercentageDiv").show();
            $("#rightDashboardFalseTriggersPercentageDiv").empty();
            $("#rightDashboardFalseTriggersPercentageDiv").append("<h5 class='totalsightings-label'>Unknown percentage</h5>");
            $("#rightDashboardFalseTriggersPercentageDiv").append("<h1 class='totalsightings-count'>" + falseTriggersPercentage.toFixed(2) + "%</h1>");
        }
    });
}

const getDefaultLastWeekCameraTrapLocations = () => {
    fetch(getDefaultLastWeekCameraTrapLocationsURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        cameraTrapLocationPlotter(data);
    })
}

const getCameraTrapLocations = () => {
    var month = $("#month").val();
    if(month == "")
        return;
    fetch(getTelanganaCameraTrapLocationsURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: month
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        cameraTrapLocationPlotter(data);
    })
}

const getMonthlySightingStatistics = () => {
    var month = $("#month").val();
    if(month == "")
        return;
    fetch(getMonthlySightingStatisticsURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: month
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        var totalSightings = 0;
        data.data.forEach((item)=> {
            totalSightings += parseInt(item.sp_count);
        })
        var humanSightings = parseInt(data.data.filter((x) => x.sp_species == 'Humans')[0].sp_count);
        var falseTriggerFilter = data.data.filter((x) => x.sp_species == 'Unknown');
        var falseTriggers;
        if(falseTriggerFilter.length)
            falseTriggers = parseInt(falseTriggerFilter[0].sp_count);
        humanInterferencePercentage = (humanSightings/totalSightings) * 100;
        falseTriggersPercentage = (falseTriggers/totalSightings) * 100;

        $("#rightDashboardTotalSightingsDiv").show();
        $("#rightDashboardTotalSightingsDiv").empty();
        $("#rightDashboardTotalSightingsDiv").append("<h5 class='totalsightings-label'>Total sightings</h5>");
        $("#rightDashboardTotalSightingsDiv").append("<h1 class='totalsightings-count'>" + totalSightings + "</h1>");

        $("#rightDashboardTotalHumanInterferencePercentageDiv").show();
        $("#rightDashboardTotalHumanInterferencePercentageDiv").empty();
        $("#rightDashboardTotalHumanInterferencePercentageDiv").append("<h5 class='totalsightings-label'>Human interference percentage</h5>");
        $("#rightDashboardTotalHumanInterferencePercentageDiv").append("<h1 class='totalsightings-count'>" + humanInterferencePercentage.toFixed(2) + "%</h1>");

        if(falseTriggerFilter.length) {
            $("#rightDashboardFalseTriggersPercentageDiv").show();
            $("#rightDashboardFalseTriggersPercentageDiv").empty();
            $("#rightDashboardFalseTriggersPercentageDiv").append("<h5 class='totalsightings-label'>Unknown percentage</h5>");
            $("#rightDashboardFalseTriggersPercentageDiv").append("<h1 class='totalsightings-count'>" + falseTriggersPercentage.toFixed(2) + "%</h1>");
        }
    });
}

const cameraTrapLocationPlotter = (data) => {
    var featuresArray = [];
    data.data.forEach((item) => {
        const iconStyle = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 46],
                //size: [30, 30],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                rotation: item.sp_rotation,
                src: '../icons/camera_trap.png'
            }),
        });
        var geom = JSON.parse(item.sp_geometry);
        const feature = new ol.Feature({
        geometry: new ol.geom.Point([geom.coordinates[0], geom.coordinates[1]]),
        camera: item.sp_camera
        //kingdom: item.json_row.properties.kingdom,
        //family: item.json_row.properties.family,
        //image: item.json_row.properties.file_uri
        });
        feature.setStyle(iconStyle);
        featuresArray.push(feature);
    });

    const vectorSource = new ol.source.Vector({
        features: [],
    });
    vectorSource.addFeatures(featuresArray);
    
    const vectorLayer = new ol.layer.Vector({
        name: 'telanganaCameraTrapLocations',
        source: vectorSource,
    });

    map.getLayers().forEach(function (layer) {
        if(layer != undefined) {
            if(layer.get('name') == "telanganaCameraTrapLocations") {
                map.removeLayer(layer);
            }
        }
    });
    map.addLayer(vectorLayer);
    map.getView().fit(vectorSource.getExtent());

    var container = document.getElementById('popup');
    var content_element = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');

    var overlay = new ol.Overlay({
        element: container,
        autoPan: true,
        offset: [0, -10],
        autoPanAnimation: {
            duration: 250
        }
    });
    map.addOverlay(overlay);

    closer.onclick = function() {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
    };

    map.on('click', function(evt) {
        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function(feature, layer) {
                return feature;
            });
        if (feature) {
            //shadab
            if(cameraImagesQueued)
                return;
            var cameraValue = feature.get('camera');
            if(cameraValue != undefined) {
                getCameraimages(feature.get('camera'));
                getCameraStatistics(feature.get('camera'));
                var geometry = feature.getGeometry();
                var coord = geometry.getCoordinates();
                //if(feature.get('name') == undefined)
                    //return;
                
                $(".ol-popup").show();
                var imageTag = '';
                //if(feature.get('image') != undefined)
                    //imageTag = '<img width=60 src=' + feature.get('image') + '></br>';
                var content = imageTag;
                content += '<label><b>' + feature.get('camera') + '</b></label></br>';
                //content += '<label>' + feature.get('kingdom') + '</label></br>';
                //content += '<label>' + feature.get('family') + '</label></br>';
                content_element.innerHTML = content;
                overlay.setPosition(coord);
                //popupFanOverlay.setPosition(coord);
            }
        }
    });


    map.on("pointermove", function (evt) {
        var hit = this.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
            return true;
        }); 
        if (hit) {
            this.getTargetElement().style.cursor = 'pointer';
        } else {
            this.getTargetElement().style.cursor = '';
        }
    });
}






const getTelanganaRanges = () => {
    var month = $("#month").val();
    if(month == "")
        return;
    fetch(getRanges,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: month
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        $("#range").empty();
        $('#range').append( new Option("Select", "") );
        data.data.forEach((rangeItem) => {
            console.log(rangeItem.sp_range);
            $('#range').append( new Option(rangeItem.sp_range, rangeItem.sp_range) );
        })
    });
}

const getTelanganaSections = () => {
    var month = $("#month").val();
    if(month == "")
        return;

    var range = $("#range").val();
    if(range == "")
        return;

    fetch(getSections,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: month,
            range: range
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        $("#section").empty();
        sectionList = [...new Set(data.data.map(item => item.sp_sections))]
        $('#section').append( new Option("Select", "") );
        sectionList.forEach((sectionItem) => {
            $('#section').append( new Option(sectionItem, sectionItem) );
        });
        cameraTrapLocationPlotter(data);
    });
}

const getSectionsCameraTraps = () => {
    var month = $("#month").val();
    if(month == "")
        return;

    var range = $("#range").val();
    if(range == "")
        return;

    var section = $("#section").val();
    if(section == "")
        return;
        

    fetch(getSectionsCameraTrapsURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: month,
            range: range,
            section: section
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        cameraTrapLocationPlotter(data);
    });
}

const getCameraimages = (camera) => {
    var month = $("#month").val();
    if(month == "")
        return;
    if(camera == undefined)
        return;
    cameraImagesQueued = true;
    fetch(getCameraimagesURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: month,
            camera: camera
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        
        $("#cameraImagesGallery").show();
        $("#cameraImagesGalleryContent").empty();
        var latitude = data.data[0].sp_latitude;
        var longitude = data.data[0].sp_longitude;
        $("#cameraImagesGalleryHeaderLabel").html("<label style='color: #ffe961;'>Camera id: " + camera + ": " + data.data.length + " images" + ",</label> <label style='color: #00ffff;'> Longitude: " + longitude + ", Latitude: " + latitude + "</label>");
        var imageGallery = '';
        data.data.forEach((item) => {
            console.log(item.sp_filepath);
            imageGallery += "<span class='camera-image-item-container'>" 
            + "<img id='" + item.sp_filename + "' src='" + item.sp_filepath + "' onclick='showImage(this.id, this.src)' class='loading camera-image-item' />" 
            + "<label class='camera-image-item-label'>" + item.sp_filename + "</label>"
            + "</span>";
        });
        $("#cameraImagesGalleryContent").html(imageGallery);
        cameraImagesQueued = false;
    });
}

const showImage = (imageName, imagePath) => {
    $("#showImageModal").show();
    $("#showImageModalDiv").empty();
    $("#showImageModalDiv").append("<img src='" + imagePath + "' class='display-image-container'/>")
    $("#showImageModalLabel").text(imageName);
}

const initializeStatisticsCheckBox = () => {
    $('#showScientificNames').change(function() {
        drawPieChart(cameraSpeciesStatisticsData, this.checked);
    });
}

const getCameraStatistics = (camera) => {
    var month = $("#month").val();
    if(month == "")
        return;
    if(camera == undefined)
        return;
    fetch(getCameraStatisticsURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: month,
            camera: camera
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        cameraSpeciesStatisticsData = data;
        drawPieChart(data, false);
    });
}

const drawPieChart = (data, useSpeciesNames) => {
    cameraSpeciesStatistics = [];
    data.data.forEach(function (item) {
        var _name;
        if(useSpeciesNames)
            _name = item.sp_species
        else
            _name = item.sp_common_name
        var t = {
            type: _name,
            value: parseInt(item.sp_count)
        }
        cameraSpeciesStatistics.push(t);
        var data = crossfilter(cameraSpeciesStatistics);
        var valueDimension = data.dimension(function (d) {
            return d.type;
        });
        var valueGroup = valueDimension.group().reduceSum(function (d) { return +d.value; });

        var pieChartValue = dc.pieChart("#statisticsPieChart")
            .width(450)
            .cx(120)
            .height(200)
            .radius(100)
            .innerRadius(0)
            .drawPaths(true)
            .dimension(valueDimension)
            .legend(dc.legend().x(250).y(10).gap(5).horizontal(false).autoItemWidth(true).legendWidth(300).legendText(function (d) {
                return d.name + "(" + d.data + ")"
            }))
            .renderLabel(true)
            .group(valueGroup)
            .title(function (p) {
                return p.key + "\n"
                        + p.value
            });
        dc.renderAll();
    });
    console.log(cameraSpeciesStatistics);
}

const resetAdminPanel = () => {
    
    $("#range").empty();
    $("#section").empty();

    $('#range').append( new Option("Range", "") );
    $('#section').append( new Option("Section", "") );

    $("#month").val("");
    $("#range").val("");
    $("#section").val("");

    if(telanganaStateExtents != null)
        map.getView().fit(telanganaStateExtents);

    map.getLayers().forEach(function (layer) {
        if(layer != undefined) {
            if(layer.get('name') == "telanganaCameraTrapLocations") {
                map.removeLayer(layer);
            }
        }
    });
    getDefaultLastWeekStatistics();
    getDefaultLastWeekCameraTrapLocations();
}

var imageIdentified = false;
var pollid = '';
const uploadTestImage = () => {
    var imageFileFormData = new FormData($('#imageFileForm')[0]);
    if($("#imageInput").val() == '')
        return;
    $("#uploadImageButton").find(".spinner-border-sm").show();
    $("#uploadStatusLabel").html("Uploading, please wait...");
    $.ajax({
        type: 'POST',
        url : uploadImageFileURL,
        data: imageFileFormData,
        dataType: 'json',
        contentType: false, 
        processData: false, 
        success: function(d) {
            if(d.status == "SUCCESS") {
                console.log("For polling: " + d.id);
                pollid = d.id;
                $("#uploadStatusLabel").html("Identifying, please wait...");
                $("#uploadImageButton").find(".spinner-border-sm").hide();
                polling();
            }
        },
        error: function(e) {
            $("#uploadImageButton").find(".spinner-border-sm").hide();
        }
    });
}


const polling = () => {
    console.log("Fetching for: " + pollid);
    fetch(pollingURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            pollid: pollid
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if(data.data[0].sp_ouput_image != undefined) {
            console.log("Identified image: " + data.data[0].sp_ouput_image);
            $("#uploadStatusLabel").empty();
            $("#uploadImageButton").find(".spinner-border-sm").hide();

            $("#identifiedImageModal").show();
            $("#identifiedImageDiv").empty();
            $("#identifiedImageDiv").append("<img src='" + data.data[0].sp_ouput_image + "' class='display-image-container'/>")
            $("#detectedSpeciesLabel").text("Species: " + data.data[0].sp_species + ", ");
            $("#detectedSpeciesCountLabel").text("Count: " + data.data[0].sp_count + ", ");
            $("#detectedAccuracyLabel").text("Accuracy: " + data.data[0].sp_accuracy + ", ");
        }
        else{
            setTimeout(() => {
                polling();
            }, 5000);
        }
    });
}

const toggleTimeSlider = () => {
    if($("#rightDashboardTimeSliderDiv").is(":visible")) {
        $("#rightDashboardTimeSliderDiv").hide();
    }
    else
        $("#rightDashboardTimeSliderDiv").show();
}

const getSpeciesList = () => {
    var month = $("#month").val();
    if(month == "")
        return;
    fetch(getSpeciesURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: month
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        console.log(data.data);
        $('#species').empty();
        $('#species').append( new Option("Select", "") );
        data.data.forEach((speciesItem) => {
            $('#species').append( new Option(speciesItem.sp_species, speciesItem.sp_species) );
        });
    });
}

var sliderBucket = [];
var sp_date = [];
const showTimeSlider = () => {
    $("#speciesTimeSlider").show();
    var month = $("#month").val();
    if(month == "")
        return;
    var species = $("#species").val();
    fetch(getSpeciesRangesURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: month,
            species: species
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        sliderBucket = [];
        sp_date = [];
        console.log(data.data);
        sliderBucket = data.data;
        sp_date = [...new Set(sliderBucket.map(item => item.sp_from_date))]
        console.log(sp_date);

        // Assign slider ticks
        $("#speciesTimeSlider").attr('min', 0);
        $("#speciesTimeSlider").attr('max', sp_date.length - 1);

        // Create Slide Bar
        var slideTicks = $("#speciesTimeSlider").width()/sp_date.length;
        console.log(slideTicks);
        var sliderLeftPosition = slideTicks/2;
        $("#slideBar").empty();
        sp_date.forEach((dateItem)=> {
            $("#slideBar").append(
                    '<span style="left: ' + sliderLeftPosition + 'px;" class="species-slider-tick-bar"></span>'
                +   '<label style="left: ' + sliderLeftPosition + 'px;" class="species-slider-tick-label">' + dateItem + '</label>'
                );
            sliderLeftPosition += slideTicks;
        });
        
    });
}

const drawEventMap = (value) => {
    var dateItem = sp_date[value];
    var geometryBucket = sliderBucket.filter((x) => x.sp_from_date == dateItem);
    geometryPlotter(geometryBucket);
}

const geometryPlotter = (geometryBucket) => {
    console.log(geometryBucket);

    sliderGeometryObject = {
        'type': 'FeatureCollection',
        'crs': {
            'type': 'name',
            'properties': {
                'name': 'EPSG:3857',
            },
        },
        'features': []
    }

    geometryBucket.forEach((item) => {
        var geometry = JSON.parse(item.sp_location);
        console.log("Style: " + geometry.type);
        sliderGeometryObject.features.push({
            'type': 'Feature',
            'geometry': geometry
        });
    });

    const vectorSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(sliderGeometryObject)
    }); 

    const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        name: 'sliderGeometryLayer',
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: null,
                stroke: new ol.style.Stroke({color: 'white', width: 1}),
              }),
        })
    });
    map.getLayers().forEach(function (layer) {
        if(layer.get('name') == "sliderGeometryLayer") {
            map.removeLayer(layer);
        }
    });
    map.addLayer(vectorLayer);
    


}

const clearUploadedImage = () => {
    $("#imageInput").val('');
}

const closeGallery = () => {
    $("#cameraImagesGalleryContent").empty();
    $("#cameraImagesGallery").hide();
}


const showHeatMap = () => {
    var month = $("#month").val();
    if(month == "")
        return;
    var species = 'Axis axis';
    fetch(getSpeciesHeatmapURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: month,
            species: species
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        console.log(data);
        var featuresArray = [];
        data.data.forEach((item) => {
            var geom = JSON.parse(item.sp_location);
            const feature = new ol.Feature({
                geometry: new ol.geom.Point([geom.coordinates[0], geom.coordinates[1]])
                //count: parseInt(item.sp_count)
            });
            featuresArray.push(feature);
        });

        const vectorSource = new ol.source.Vector({
            features: [],
        });
        vectorSource.addFeatures(featuresArray);
        const vector = new ol.layer.Heatmap({
            source: vectorSource,
            blur: parseInt(15, 10),
            radius: parseInt(5, 10),
            weight: function (feature) {
              const name = feature.get('count');
              return name;
            },
          });
          map.addLayer(vector);
    });
}


const imageModalActionsCorrection = () => {
    $("#modalCloseButtonTop").on("click", function (e) {
        e.preventDefault();
        $("#identifiedImageModal").hide();
    });
    $("#modalCloseButtonBottom").on("click", function (e) {
        e.preventDefault();
        $("#identifiedImageModal").hide();
    });

    $("#showImageModalCloseButtonTop").on("click", function (e) {
        e.preventDefault();
        $("#showImageModal").hide();
    });
    $("#showImageModalCloseButtonBottom").on("click", function (e) {
        e.preventDefault();
        $("#showImageModal").hide();
    });
}

/* const getStateStatistics = (name) => {
            var data = {
                name
            }
            fetch(getStateStatisticsURL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {

            });
        } */