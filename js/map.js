var geojsonObject = '';
var cameraGeojsonObject = '';
var telanganaStateExtents = null;
var cameraSpeciesStatistics = [];
var cameraSpeciesStatisticsData = null;

const initMap = () => {
    var attribution = new ol.control.Attribution({
        collapsible: false
    });
    mapview = new ol.View({
        center: ol.proj.fromLonLat([81.0095998, 22.3052918]),
        maxZoom: 18,
        zoom: 4.5,
    });
    const cartoDBdarkAll = new ol.layer.Tile({
        source: new ol.source.OSM({
            url: "http://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        }),
        visible: false,
        title: 'cartoDBdarkAll'
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
            source: new ol.source.OSM({
                url: "http://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            }),
            title: 'cartoDBdarkAll'
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
    getTelanganaBoundary();
    initializeStatisticsCheckBox();
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
                    color: 'rgba(3, 145, 255, 0.7)',
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
    if(camera == undefined)
        return;
    fetch(getCameraimagesURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            camera: camera
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        
        $("#cameraImagesGallery").show();
        $("#cameraImagesGalleryContent").empty();
        $("#cameraImagesGalleryHeaderLabel").html(camera + ": " + data.data.length + " images");
        var imageGallery = '';
        data.data.forEach((item) => {
            console.log(item.sp_filepath);
            imageGallery += "<span class='camera-image-item-container'>" 
            + "<img id='" + item.sp_filename + "' src='" + item.sp_filepath + "' class='loading camera-image-item' />" 
            + "<label class='camera-image-item-label'>" + item.sp_filename + "</label>"
            + "</span>";
        });
        $("#cameraImagesGalleryContent").html(imageGallery);
    });
}

const initializeStatisticsCheckBox = () => {
    $('#showScientificNames').change(function() {
        drawPieChart(cameraSpeciesStatisticsData, this.checked);
    });
}

const getCameraStatistics = (camera) => {
    if(camera == undefined)
        return;
    fetch(getCameraStatisticsURL,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
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
}

const uploadTestImage = () => {
    var imageFileFormData = new FormData($('#imageFileForm')[0]);
    if($("#imageInput").val() == '')
        return;
    $("#uploadImageButton").find(".spinner-border-sm").show();
    $.ajax({
        type: 'POST',
        url : uploadImageFileURL,
        data: imageFileFormData,
        dataType: 'json',
        contentType: false, 
        processData: false, 
        success: function(d) {
            if(d.status == "SUCCESS") {
                $("#uploadImageButton").find(".spinner-border-sm").hide();
            }
        },
        error: function(e) {
            $("#uploadImageButton").find(".spinner-border-sm").hide();
        }
    });
}

const clearUploadedImage = () => {
    $("#imageInput").val('');
}

const closeGallery = () => {
    $("#cameraImagesGalleryContent").empty();
    $("#cameraImagesGallery").hide();
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