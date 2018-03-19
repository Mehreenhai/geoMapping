
var url1 = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var url2 = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

d3.json(url1, function(data) {
    createFeatures(data.features);
});





function createFeatures(earthquakeData) {

    d3.json(url2, function(data) {
        addFeatures(data.features);
    });
    
    function addFeatures(faultData) {
        var faultLines = L.geoJSON(faultData);
        // console.log(faultData)
        
    

    var circleMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/" +
    "tiles/256/{z}/{x}/{y}?access_token=" +
    "pk.eyJ1Ijoia2pnMzEwIiwiYSI6ImNpdGRjbWhxdjAwNG0yb3A5b21jOXluZTUifQ.T6YbdDixkOBWH_k9GbS8JQ");

    var satelliteMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/" +
    "tiles/256/{z}/{x}/{y}?access_token=" +
    "pk.eyJ1Ijoia2pnMzEwIiwiYSI6ImNpdGRjbWhxdjAwNG0yb3A5b21jOXluZTUifQ.T6YbdDixkOBWH_k9GbS8JQ");

    var darkMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/" +
    "tiles/256/{z}/{x}/{y}?access_token=" +
    "pk.eyJ1Ijoia2pnMzEwIiwiYSI6ImNpdGRjbWhxdjAwNG0yb3A5b21jOXluZTUifQ.T6YbdDixkOBWH_k9GbS8JQ");

    var myMap = L.map("map", {
        center: [38.0902, -100.7129],
        zoom: 4.5,
        layers: [circleMap]
    });
 
    /////// ADDING TIMELINE

    var timeList = [];

    for (var i = 0; i < earthquakeData.length; i++) {

        quakeTime = moment(earthquakeData[i]['properties']['time']);
        
        timeList.push(quakeTime['_d'])
 
    }

    console.log(Math.max(...timeList));   
    console.log(Math.min(...timeList));   
    
    function sipriReportTimeline(earthquakeData){

        var getInterval = function(feature) {
            return {
                start: Math.min(...timeList),
                end: Math.max(...timeList)
            };
        };
        var timelineControl = L.timelineSliderControl({
            formatOutput: function(date){
                return new Date(date).toString();
            },
            duration: 100000,
        });
        var timeline = L.timeline(earthquakeData, {
            getInterval: getInterval,
            // pointToLayer: sipriReportPointToLayer,
        });

        timelineControl.addTo(myMap);
        timelineControl.addTimelines(timeline);
        timeline.addTo(myMap);
    };

       
    /////// DEFINING COLOR SCALE

    var getColors2 = d3.scaleLinear()
                        .domain(d3.extent(earthquakeData, function(feature){
                                            return feature.properties.mag;
                                        }))
                        .range(['Yellow', 'Red']);


    var circleList = [];
    var magList = [];
    var heatArray = [];
    
//// CREATING CIRCLE MARKERS + POPUPS
    for (var i = 0; i < earthquakeData.length; i++) {

        var locData = earthquakeData[i]['geometry']['coordinates']
        var circleData = earthquakeData[i]['properties']

        var circleLoc = [locData[1], locData[0]];
        var circlePlace = circleData['place'];
        var circleTime = circleData['time']
        var circleRadius = circleData['mag']

        var circleMarker = L.circle(circleLoc, {
            color: 'none',
            fillColor: getColors2(circleRadius),
            fillOpacity: 0.75,
            radius: circleRadius *25000
        }).bindPopup("Place: " + circlePlace + "<hr>" + 
                     "Time: " + circleTime);

        circleList.push(circleMarker);
        magList.push(circleRadius);
        heatArray.push([locData[1], locData[0]])
        
        
        };

//// ADDING CLUSTER GROUP
    var layer = L.geoJSON(earthquakeData, {
        
        onEachFeature: function(feature, layer){
            // Add a pop-up message for each marker
            layer.bindPopup(feature.properties.place + " & Magnitude: " + feature.properties.mag);
        }
    });
            
    var clusterGroup = L.markerClusterGroup().addLayer(layer);

    var layerCircles = L.layerGroup(circleList);
    
    ////// ADDING HEAT MAP LAYER
    var heatLayerMap  =  L.heatLayer(heatArray, {
        radius: 20,
        blur: 35,
        minOpacity: 10

    });


//// PUTTING EVERYTHING TOGETHER
    var baseMaps = {
        "Light Map": circleMap, 
        "Satellite Map": satelliteMap,
        "Dark Map": darkMap
        
    };

    
    var overlayMaps = {
        Earthquakes: layerCircles,
        "Fault Lines": faultLines,
        "Heat Map": heatLayerMap,
        "Cluster Group": clusterGroup
    };


    L.control
        .layers(baseMaps, overlayMaps, {
            collapsed: false
        }).addTo(myMap);


    ///////// Setting up the legend
    

    var legend = L.control({
        position: "bottomright"
        
    });


    legend.onAdd = function() {
        var div = L.DomUtil.create("div", "info legend");
        var maxMag = Math.max(...magList);
        var minMag = Math.min(...magList);
        var intervalMag = maxMag - minMag;
        var limits = [minMag , intervalMag/5, intervalMag/2.5, intervalMag/1.66, maxMag];

        var labels = [];

        // Add min & max
        var legendInfo = "<h5>Earthquake Magnitude</h5>";

        div.innerHTML = legendInfo;
        
        limits.forEach(function(limit, index) {
            labels.push("<li style=\"background-color: " +
                        getColors2(limit)
                        + "\"><b> <= " + limit.toFixed(2) +"</b></li>" );
        });

        div.innerHTML += "<ul>" + labels.join("") + "</ul>";
        return div;
    };

    // Adding legend to the map
    legend.addTo(myMap);



    }

};

