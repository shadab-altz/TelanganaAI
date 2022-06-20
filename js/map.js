var geojsonObject = '';
var cameraGeojsonObject = '';
        
        const initMap = () => {
            var attribution = new ol.control.Attribution({
                collapsible: false
            });
            mapview = new ol.View({
                center: ol.proj.fromLonLat([81.0095998, 22.3052918]),
                maxZoom: 18,
                zoom: 4.5,
            });
            const cartoDBlightAll = new ol.layer.Tile({
                source: new ol.source.OSM({
                    url: "http://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
                }),
                visible: false,
                title: 'cartoDBlightAll'
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
                            url: "http://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
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
            getTelanganaBoundary();
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
                    map.getView().fit(vectorSource.getExtent());
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
                    const iconStyleFov = new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.0, 50],
                            //size: [30, 30],
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'pixels',
                            rotation: item.sp_rotation,
                            src: '../icons/fov.png'
                        }),
                    });
                    var styleArray = [];
                    styleArray.push(iconStyle);
                    styleArray.push(iconStyleFov);
                    var geom = JSON.parse(item.sp_geometry);
                    const feature = new ol.Feature({
                    geometry: new ol.geom.Point([geom.coordinates[0], geom.coordinates[1]]),
                    camera: item.sp_camera
                    //kingdom: item.json_row.properties.kingdom,
                    //family: item.json_row.properties.family,
                    //image: item.json_row.properties.file_uri
                    });
                    feature.setStyle(styleArray);
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
                //var popupFan = document.getElementById('popupFan');

                var overlay = new ol.Overlay({
                    element: container,
                    autoPan: true,
                    offset: [0, -10],
                    autoPanAnimation: {
                        duration: 250
                    }
                });
                map.addOverlay(overlay);

                /* var popupFanOverlay = new ol.Overlay({
                    element: popupFan,
                    autoPan: true,
                    offset: [0, -10],
                    autoPanAnimation: {
                        duration: 250
                    }
                });
                map.addOverlay(popupFanOverlay); */

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
            })
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