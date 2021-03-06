// MODE
var mode;
var rotarmapa = false;
function SaveModePreference(mode) {
    if (Modernizr.localstorage) {
        window.localStorage.setItem("mode", mode);
    } else {
        //cookie mode
    }
}
function GetModePreference() {
    if (Modernizr.localstorage) {
        return window.localStorage.getItem("mode");
    } else {
        //cookie mode
    }
}
function ClearModeSetting() {
    if (Modernizr.localstorage) {
        window.localStorage.removeItem("mode");
    } else {
        //cookie mode
    }
}

// POI FORMAT
var pois;

function HasDiscap($poi) {
    return parseInt($poi.find("label[term='Cabinas_discapacitados']").text()) > 0;
}
function HasVigilado($poi) {
    return parseInt($poi.find("label[term='Vigilado']").text()) > 0;
}
function GetName($poi) {
    return $poi.find("label[term='Name']").text();
}
function FormatPOIs(data) {
    pois = [];
    $(data).find("poi").each(function(i, item) {
        var $item = $(item);
        pois.push(
            {
                x:parseFloat($item.find("location point").attr("latitude"))
                , y:parseFloat($item.find("location point").attr("longitude"))
                , discap: HasDiscap($item)
                , vigilado: HasVigilado($item)
                , name: GetName($item)
            }
        );
    });
    return pois;
}
function LoadPOIs(callback) {
    $.ajax({
        url: "static/POIS.xml"
        , success: function(data) {
            pois = FormatPOIs(data);
            callback();
        }
        , error: function(e) {
            console.log(e);
        }
    });
}
function FilterData() {
    if (mode == "disabled") {
        var excludedPOIs = [];
        for (var poi = 0; poi < pois.length; poi++) {
            if (!pois[poi].discap) {
                excludedPOIs.push(poi);
            }
        }
        excludedPOIs.reverse();
        for (var excPOI = 0; excPOI < excludedPOIs.length; excPOI++) {
            pois.splice(excludedPOIs[excPOI], 1);
        }
    }
    if (mode == "vigilado") {
        var excludedPOIs = [];
        for (var poi = 0; poi < pois.length; poi++) {
            if (!pois[poi].vigilado) {
                excludedPOIs.push(poi);
            }
        }
        excludedPOIs.reverse();
        for (var excPOI = 0; excPOI < excludedPOIs.length; excPOI++) {
            pois.splice(excludedPOIs[excPOI], 1);
        }
    }
}
// NEAREST POI
function TransformPoint(point) {
    var epsg4326 = new OpenLayers.Projection('EPSG:4326');
    var epsgWebMercator = new OpenLayers.Projection('EPSG:3857');
    var pt_webMercator= point.transform(epsg4326,epsgWebMercator);
    return pt_webMercator;
}

function GetNearestWC() {
    var minDist = 999999999, tgtPOI = null, rawPoi = null;
    var tmpPOI, tmpDist;
    for (var p = 0; p < pois.length; p++) {
        tmpPOI = TransformPoint(new OpenLayers.Geometry.Point(pois[p].y, pois[p].x));
        tmpDist = currentLoc.distanceTo(tmpPOI);
        if (tmpDist < minDist) {
            rawPoi = pois[p];
            minDist = tmpDist;
            tgtPOI = tmpPOI;
            destLatLong = {"lat": pois[p].x, "long": pois[p].y};
        }
    }
    return tgtPOI;
}
// ROUTE DISPLAY
function DisplaySimpleRoute() {
    rutaSencilla.removeAllFeatures();
    line = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([currentLoc, poiDestino]));
    rutaSencilla.addFeatures([line]);
    map.zoomToExtent(rutaSencilla.getDataExtent());
}
function GetRoute() {
    var url = "proxy.php?url=https%3A%2F%2Fmaps.googleapis.com%2Fmaps%2Fapi%2Fdirections%2Fjson%3Forigin%3D" + posLatLong.lat + "," + posLatLong.long + "%26destination%3D" +  destLatLong.lat + "," + destLatLong.long + "%26mode%3Dwalking%26key%3DAIzaSyCnAT1ozF8bBJKkawHntoB0VdPVeW7Lh90&full_headers=1&full_status=1";
    $.ajax({
        //url: "proxy.php?url=https%3A%2F%2Fmaps.googleapis.com%2Fmaps%2Fapi%2Fdirections%2Fjson%3Forigin%3DToronto%26destination%3DMontreal%26mode%3Dwalking%26key%3DAIzaSyCnAT1ozF8bBJKkawHntoB0VdPVeW7Lh90&full_headers=1&full_status=1"
        url: url
        //url: "proxy.php?url=http://www.google.com"
        , success: function(data) {
            if (data && data.contents && data.contents.routes && data.contents.routes.length > 0) {
                var steps = data.contents.routes[0].legs[0].steps;
                rutaSencilla.removeAllFeatures();
                rutaORS.removeAllFeatures();
                for (var l = 0; l < steps.length; l++) {
                    line = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([currentLoc, poiDestino]));
                    rutaORS.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([
                        TransformPoint(new OpenLayers.Geometry.Point(steps[l].start_location.lng, steps[l].start_location.lat))
                        , TransformPoint(new OpenLayers.Geometry.Point(steps[l].end_location.lng, steps[l].end_location.lat))]))]);
                }
                map.zoomToExtent(rutaORS.getDataExtent());
            }
        }
    });
    //https://maps.googleapis.com/maps/api/directions/json?origin=Toronto&destination=Montreal&key=AIzaSyCnAT1ozF8bBJKkawHntoB0VdPVeW7Lh90
}
// MAIN FN
function CalculateNextWC() {
    initMap();
    initOrientation();
    initGeoLocation();
}


var alpha = 0;
function getAngle(p1, p2) {
	var deltaY = p2.y - p1.y;
	var deltaX = p2.x - p1.x;
	var angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
	return angle - alpha;
}
function calculaRotacionCSS3(angulo) {
	return 360 - angulo;
}
function formatDistance(d) {
	if (d >= 1000) {
		d = (d / 1000).toFixed(1) + "km"
	} else {
		d = Math.round(d) + "m";
	}
	return d;	 
}
function getDistance() {
	return currentLoc.distanceTo(poiDestino)
}
var first = true;
var line;
function drawUI() {
	if (currentLoc && poiDestino) {
        inicio.removeAllFeatures();
        inicio.addFeatures([new OpenLayers.Feature.Vector(currentLoc)]);
		if (first) {
			$("#arrow, #distancia, #reload, #rotarmapa").show();
			first = false;
		}
		var rotation = calculaRotacionCSS3(Math.round(getAngle(currentLoc, poiDestino)));
		$("#arrow").rotate(rotation);
        if (rotarmapa) {
            $("#map").rotate(rotation);
        }
        //$("#map").rotate(rotation);
		$("#distancia").html(formatDistance(getDistance()));

	}
}
var map, inicio, destino, rutaSencilla, rutaORS, geolocate;
var posLatLong, destLatLong;
var currentLoc, poiDestino = null;
function initMap() {
    //var b = new OpenLayers.Bounds(480408, 4599748, 742552, 4861892);
    var b = new OpenLayers.Bounds(42.83, -1.717, 42.865, -1.665);
    map = new OpenLayers.Map('map', {
        projection: cfg.map.projection
        , maxExtent: b
        , displayOutsideMaxExtent: true
    });
    var base = new OpenLayers.Layer.OSM();
    inicio = new OpenLayers.Layer.Vector('inicio',
        {
            styleMap: new OpenLayers.StyleMap({pointRadius: 8, fillColor: "#00FF00", fillOpacity: 0.5 })
        }
    );
    destino = new OpenLayers.Layer.Vector('destino',
        {
            styleMap: new OpenLayers.StyleMap({pointRadius: 8, fillColor: "#FF0000", fillOpacity: 0.5 })
        });
    rutaSencilla = new OpenLayers.Layer.Vector('rutaSencilla',
        {
            styleMap: new OpenLayers.StyleMap({strokeColor: "#0000FF", strokeWidth: 2, strokeDashstyle: "dash" })
        });
    rutaORS = new OpenLayers.Layer.Vector('rutaORS',
        {
            styleMap: new OpenLayers.StyleMap({strokeColor: "#0000FF", strokeWidth: 2 })
        });
    map.addLayers([
        base
        , inicio
        , destino
        , rutaSencilla
        , rutaORS
    ]);
    geolocate = new OpenLayers.Control.Geolocate({
        bind: true,
        watch: true,
        geolocationOptions: { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    });
    map.addControl(geolocate);
    geolocate.events.register("locationupdated", geolocate, function (e) {
        currentLoc = e.point;
        //console.log(e);
        if (!poiDestino) {
            posLatLong = {"lat": e.position.coords.latitude, "long": e.position.coords.longitude};
            LoadPOIs(function() {
                FilterData();
                poiDestino = GetNearestWC();
                destino.removeAllFeatures();
                destino.addFeatures([new OpenLayers.Feature.Vector(poiDestino)]);
                DisplaySimpleRoute();
                GetRoute();
                drawUI();
            });
        } else {
            drawUI();
        }
/*
        if (!poiDestino) {
            inicio.removeAllFeatures();
            inicio.addFeatures([new OpenLayers.Feature.Vector(e.point)]);
            map.zoomToExtent(inicio.getDataExtent());
            var poiType = FindPOIType();
            first = true;
            findNearestPOI(poiType.typeName, e.point);
        } else {
            drawUI();
        }
        */
    });
    map.zoomToExtent(b);
}
var deviceorientation_evt;
function initOrientation() {
    if (!deviceorientation_evt) {
        if (window.DeviceOrientationEvent) {
            deviceorientation_evt = window.addEventListener("deviceorientation", function (e) {
                if (typeof (e.alpha) != 'undefined') {
                    //document.getElementById('resultDeviceOrientation').innerHTML = document.getElementById('resultDeviceOrientation').innerHTML + "Alpha: " + event.alpha + "<br>";
                    //document.getElementById('resultDeviceOrientation').innerHTML = document.getElementById('resultDeviceOrientation').innerHTML + "Beta: " + event.beta + "<br>";
                    //Check for iOS property
                    if (event.webkitCompassHeading) {
                        alpha = -event.webkitCompassHeading;
                        //Rotation is reversed for iOS
                        compass.style.WebkitTransform = 'rotate(-' + alpha + 'deg)';
                    }
                        //non iOS
                    else {
                        alpha = event.alpha;
                        if (!window.chrome) {
                            //Assume Android stock (this is crude, but good enough for our example) and apply offset
                            alpha = alpha - 270;
                        }
                    }
                    drawUI();
                }
                //if (typeof(event.absolute) != 'undefined') {
                //	document.getElementById('resultDeviceOrientation').innerHTML = document.getElementById('resultDeviceOrientation').innerHTML + "Gamma: " + event.absolute + "<br>";
                //}
                //if (typeof(event.compassCalibrate) != 'undefined') {
                //	document.getElementById('resultDeviceOrientation').innerHTML = document.getElementById('resultDeviceOrientation').innerHTML + "Gamma: " + event.compassCalibrated + "<br>";
                //}
            }, false);
        }
    }
}
function initGeoLocation() {
    geolocate.deactivate();
    geolocate.activate();
}
function initUI() {
    $("#reload").on("click", function() {
        ClearModeSetting();
        window.location.reload();
    });
    $("#rotarmapa").on("click", function() {
        if (rotarmapa) {
            $("#map").rotate(0);
        }
        rotarmapa = !rotarmapa;
    });
}
function init() {
    initUI();
    mode = GetModePreference();
    if (mode) {
        // lanzar busqueda
        $("body").css("background", "transparent");
        CalculateNextWC();
    } else {
        // UI seleccion modo
        $("#modeSelectScene").show();
        $("#normal, #disabled, #vigilado").on("click", function() {
            $("body").css("background", "transparent");
            $("#modeSelectScene").hide();
            mode = $(this).data("mode");
            SaveModePreference(mode);
            CalculateNextWC();
        });
    }
}
init();
//window.setTimeout(init, 1);

//function onLocationFound(e) {
//	console.log(e);
//    var radius = e.accuracy / 2;
//    L.marker(e.latlng).addTo(map);
//		//.bindPopup("You are within " + radius + " meters from this point").openPopup();
//    //L.circle(e.latlng, radius).addTo(map);
//	encuentraBuzonProximo();
//}
//function onLocationError(e) {
//	map.setView([42.8167, -1.6442], 14);
//    console.log(e.message);
//}
//var map = L.map('map');
//L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//    maxZoom: 19
//}).addTo(map);
//L.tileLayer.wms("http://pmpwvsig19:8080/geoserver/ows", {
//    layers: 'DIRECC_Sym_Buzones',
//    format: 'image/png',
//    transparent: true
//}).addTo(map);
//
//
//map.on('locationfound', onLocationFound);
//map.on('locationerror', onLocationError);
//map.locate({setView: true});